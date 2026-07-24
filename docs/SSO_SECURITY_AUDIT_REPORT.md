# Sicherheits-Audit: SSO, Sessions und SharePoint-Authentifizierung

> **Historischer Teilbericht:** Dieses Dokument hält den damaligen SSO-Teilaudit fest. Der
> aktuelle, repositoryweite Abschlussstatus einschließlich späterer Härtungen und offener
> Betriebsmaßnahmen steht in [`SECURITY_AUDIT_REPORT.md`](./SECURITY_AUDIT_REPORT.md).

Stand: 17. Juli 2026

## Management Summary

Der dokumentierte Entra-SSO- und Session-Flow wurde auf Codeebene auditiert und gehaertet. Alle
sieben in `ENTRA_SSO_IMPLEMENTATION.md` genannten Befunde wurden im aktuellen Branch behoben.
Zusaetzlich wurden zwei zuvor nicht dokumentierte kritische beziehungsweise hohe Probleme
geschlossen:

- Der Legacy-Endpunkt `/api/auth/create-token` stellte Admin-JWTs allein anhand vom Browser
  gelieferter Identitaets- und Gruppenwerte aus.
- Schreibende Aufrufe des SharePoint-Service-Account-Proxys hatten keinen zentralen App-Session-
  und Instanz-Admin-Guard.

Die Anwendung verwendet fuer den Browser nun eine ausschliesslich serverseitig gesetzte
`HttpOnly`-Cookie-Session. Entra-ID-Tokens werden anhand der tenant-spezifischen OpenID-Metadaten
und Microsoft-JWKS validiert. Schreibende Cookie-Requests benoetigen zusaetzlich eine passende
`Origin`.

Ein Live-End-to-End-Test gegen den produktiven Entra-Tenant und das On-Premises-SharePoint war im
lokalen Audit nicht moeglich, da dafuer reale Tenant-, Kerberos- und NTLM-Zugangsdaten sowie die
Produktions-Proxykette erforderlich sind. Die statischen Checks und der lokale Produktions-Build
sind im Abschnitt "Verifikation" festgehalten.

## Scope und Methode

Geprueft wurden:

- Entra Authorization Code Flow mit PKCE,
- Callback, ID-Token, Graph-Profil und Gruppen,
- internes JWT, Cookie, Browserzustand, CSRF und Logout,
- Redirect- und Popup-Flows,
- serverseitige Session- und Instanzautorisierung,
- SharePoint-Proxy mit Kerberos/SPNEGO, NTLM-Fallback, Basic und `delegated`,
- Legacy-Authentifizierungsrouten,
- installierte npm-Abhaengigkeiten.

Als normative Referenz fuer die Entra-Pruefungen dient Microsofts Dokumentation zu
[ID-Token-Validierung](https://learn.microsoft.com/en-us/entra/identity-platform/id-tokens),
[ID-Token-Claims](https://learn.microsoft.com/en-us/entra/identity-platform/id-token-claims-reference)
und
[OIDC-Logout](https://learn.microsoft.com/en-us/entra/identity-platform/v2-protocols-oidc).
Microsoft verlangt fuer vertrauliche Webanwendungen unter anderem die Pruefung von Signatur,
Issuer, Audience, Zeitclaims und `nonce`.

## Ergebnisse und umgesetzte Massnahmen

| ID      | Befund vor der Aenderung                                                                           |       Einstufung | Massnahme                                                                                                                                                          | Status  |
| ------- | -------------------------------------------------------------------------------------------------- | ---------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| SSO-01  | `entra_nonce` wurde weder validiert noch geloescht                                                 |             Hoch | Callback verlangt den Cookie, vergleicht ihn mit der validierten Claim und loescht ihn in allen Callback-Pfaden                                                    | Behoben |
| SSO-02  | ID-Token wurde nur Base64URL-dekodiert                                                             |             Hoch | `jose` validiert RS256-Signatur, tenant-spezifischen Issuer, Client-ID als Audience, Zeitclaims und Nonce ueber Microsoft-Metadaten/JWKS                           | Behoben |
| SSO-03  | App-JWT lag in `sessionStorage` und einem JavaScript-lesbaren Cookie                               |             Hoch | JWT nur noch im `HttpOnly; SameSite=Lax; Secure`-Cookie; kein JWT in Popup-Nachricht, URL oder Web Storage                                                         | Behoben |
| SSO-04  | Bekannter `JWT_SECRET`-Fallback                                                                    |         Kritisch | Kein Fallback; mindestens 32 Zeichen und keine bekannten Platzhalter; SSO-Status bleibt sonst deaktiviert                                                          | Behoben |
| SSO-05  | JWT- und Cookie-Laufzeit waren entkoppelt                                                          |           Mittel | Eine validierte `JWT_EXPIRES_IN`-Quelle steuert JWT und Cookie                                                                                                     | Behoben |
| SSO-06  | Sichere `returnUrl` verlor Query-Parameter                                                         | Niedrig/Funktion | Zentrale lokale URL-Pruefung erhaelt Query und Hash, lehnt externe, schemalose, Backslash-, Steuerzeichen- und doppelt kodierte Varianten ab                       | Behoben |
| SSO-07  | Logout loeschte nur lokalen JavaScript-Zustand                                                     |           Mittel | Serverseitige Logout-Route loescht das HttpOnly-Cookie und ruft optional den tenant-spezifischen Microsoft-Logout auf                                              | Behoben |
| AUTH-01 | Browser konnte ueber `/api/auth/create-token` eigene Identitaet/Admin-Gruppen behaupten            |         Kritisch | Legacy-Token- und Popup-Endpunkte liefern HTTP 410; interaktiver Login nur noch ueber Entra                                                                        | Behoben |
| AUTH-02 | HttpOnly-Cookie haette ohne Zusatzschutz CSRF ermoeglichen koennen                                 |             Hoch | Unsichere Methoden mit Cookie-Session verlangen eine zur Forwarded-Origin passende `Origin`                                                                        | Behoben |
| SP-01   | Schreibender SharePoint-Proxy nutzte Service-Credentials ohne zentralen Benutzer-/Admin-Guard      |         Kritisch | Alle Nicht-GET/HEAD/OPTIONS-Aufrufe verlangen eine gueltige App-Session und live aufgeloesten Instanz-Adminzugriff                                                 | Behoben |
| SP-02   | `delegated` vertraute frei lieferbaren Identitaetsheadern und leitete Cookies an SharePoint weiter |             Hoch | Modus standardmaessig gesperrt; explizites Trust-Flag, authentifizierter Benutzerheader und `Negotiate`-Header erforderlich; App-Cookies werden nie weitergeleitet | Behoben |

## Technische Details der Behebungen

### Entra/OIDC

[`packages/entra-sso/src/core/oidc.ts`](../packages/entra-sso/src/core/oidc.ts) laedt die
tenant-spezifische OpenID-Konfiguration. `jose` verwendet den dort publizierten `jwks_uri` und
unterstuetzt die Microsoft-Schluesselrotation. Akzeptiert wird nur `RS256`. Erwarteter Issuer und
Audience werden nicht aus dem ungeprueften Token uebernommen, sondern aus Metadaten und
`ENTRA_CLIENT_ID` vorgegeben.

[`pages/api/auth/entra/callback.ts`](../pages/api/auth/entra/callback.ts) verlangt jetzt
`state`, PKCE-Verifier und `nonce`. Saemtliche temporaeren Login-Cookies werden auch bei Fehlern
geloescht. Erst Claims aus dem validierten ID-Token duerfen als Zusatzdaten in die App-Session
einfliessen. Die primaere Identitaet wird weiterhin ueber Microsoft Graph `/me` aufgeloest.

### App-Session, XSS und CSRF

Das App-JWT wird nur im Cookie `roadmap-admin-token` gespeichert. Das Cookie ist `HttpOnly`,
`SameSite=Lax`, unter HTTPS beziehungsweise in Produktion `Secure` und hat dieselbe Laufzeit wie
das JWT. Frontend-Code sendet keine Bearer-Tokens mehr und prueft den Zustand ueber
`/api/auth/check-admin-session`.

[`utils/apiAuth.ts`](../utils/apiAuth.ts) akzeptiert den Cookie bei schreibenden Requests nur,
wenn [`utils/sessionSecurity.ts`](../utils/sessionSecurity.ts) die `Origin` gegen Protokoll und Host
der Forwarded-Proxyinformationen bestaetigt. Das setzt voraus, dass der produktive Reverse Proxy
eingehende `X-Forwarded-Proto`- und `X-Forwarded-Host`-Header entfernt und selbst korrekt setzt.

### Secret und Laufzeit

`getJwtSecret()` verweigert fehlende, zu kurze und bekannte Beispielwerte. Der Fehler wird nicht
durch einen eingebauten Schluessel kompensiert. `getSessionTtlSeconds()` akzeptiert positive Werte
wie `3600`, `30m`, `8h` oder `1d`. Der daraus berechnete Sekundenwert wird fuer JWT und Cookie
verwendet.

### Redirect und Logout

`normalizeLocalReturnUrl()` verwendet eine feste synthetische Origin als Parserbasis. Dadurch
koennen Pfad, Query und Fragment erhalten bleiben, ohne eine Origin aus einem potenziell
manipulierten Host-Header zu vertrauen. Netzwerkpfade (`//...`), Backslashes, Steuerzeichen,
ungueltige Prozentkodierung und nach Dekodierung externe Pfadformen fallen auf `/admin` zurueck.

[`pages/api/auth/entra/logout.ts`](../pages/api/auth/entra/logout.ts) loescht das Cookie
serverseitig. Standardmaessig folgt der Microsoft-Logout; `local=1` beendet bewusst nur die
App-Session. `ENTRA_POST_LOGOUT_REDIRECT_URI` muss im Entra-App-Objekt als erlaubte Ruecksprung-URL
registriert werden. Ohne diese Variable wird die Origin der expliziten `ENTRA_REDIRECT_URI`
verwendet, nicht ein beliebiger Request-Host.

## NTLM und Kerberos: klare Abgrenzung

Entra SSO authentifiziert den Browserbenutzer gegen die Roadmap-Anwendung. NTLM und Kerberos
authentifizieren dagegen den **Roadmap-Server gegen das On-Premises-SharePoint**. Das sind getrennte
Sicherheitsgrenzen. Die Entra-Identitaet wird im Standardbetrieb nicht an SharePoint delegiert.

### Was mit Kerberos gemacht wird

- Der normalisierte Instanzmodus `kerberos` ist der Standard.
- Der SharePoint-Proxy startet `curl --negotiate` und spricht SPNEGO mit SharePoint.
- Sind `SP_KERBEROS_SERVICE_USER` und `SP_KERBEROS_SERVICE_PASSWORD` gesetzt, wird dieses technische
  Konto verwendet. Ohne diese Werte wird die Kerberos-Identitaet des Serverprozesses verwendet.
- GET-, HEAD- und Schreiboperationen sowie der SharePoint-Form-Digest laufen ueber diesen Kanal.
- Die Autorisierung des Entra-Benutzers muss vorher in der Roadmap erfolgen, da SharePoint im
  Service-Account-Modell nur das technische Konto sieht.

Kerberos ist das bevorzugte Verfahren: Es verwendet Tickets statt einer Challenge-Response mit
dem Passwort-Hash und kann gegenseitige Authentifizierung bieten, wenn SPNs, DNS, Zeit und
Servicekonto korrekt konfiguriert sind. Microsoft beschreibt Kerberos gegenueber NTLM als das
staerkere und bevorzugte Verfahren und hebt die gegenseitige Authentifizierung hervor
([Kerberos-Ueberblick](https://learn.microsoft.com/en-us/windows-server/security/kerberos/kerberos-authentication-overview),
[NTLM-Ueberblick](https://learn.microsoft.com/en-us/windows/win32/secauthn/microsoft-ntlm)).

### Was mit NTLM gemacht wird

- `ntlm` ist **kein eigenstaendiger konfigurierbarer Instanzmodus**. Der Legacy-Strategiewert
  `ntlm` wird von `normalizeSharePointStrategy()` auf `kerberos` normalisiert.
- NTLM wird nur als expliziter `curl --ntlm`-Fallback verwendet, wenn `--negotiate` HTTP 401
  liefert, Service-Benutzer und Passwort vorhanden sind und `SP_CURL_NTLM_FALLBACK` nicht `false`
  ist.
- Im Normalbetrieb erfolgt der Fallback nach dem ersten 401. Nach Erfolg merkt sich der Prozess
  NTLM fuer das jeweilige Instanz-/SharePoint-Ziel im Arbeitsspeicher. Schlaegt NTLM spaeter fehl,
  wird Kerberos erneut versucht.
- Der Fallback gilt sowohl fuer Lese- als auch Schreibzugriffe und den Form-Digest.

NTLM ist damit eine Kompatibilitaetsbruecke fuer SharePoint/IIS-Umgebungen, in denen Kerberos nicht
funktioniert. Es ist keine Browseranmeldung und transportiert nicht die Entra-Benutzeridentitaet.
Wenn die Infrastruktur vollstaendig Kerberos-faehig ist, sollte `SP_CURL_NTLM_FALLBACK=false`
gesetzt werden, damit Fehlkonfigurationen von SPN/Kerberos nicht unbemerkt durch NTLM verdeckt
werden.

### `delegated` ist weder der Kerberos-Standard noch NTLM-Fallback

Der Modus `delegated` ist ein separater, standardmaessig deaktivierter Integrationspfad. Er darf nur
hinter einem vertrauenswuerdigen Reverse Proxy aktiviert werden, der vom Client gelieferte
Identitaetsheader entfernt, den authentifizierten Benutzer selbst einsetzt und ein echtes
`Authorization: Negotiate ...` weitergibt. Das neue Flag lautet
`SP_TRUST_DELEGATED_PROXY=true`. Roadmap-Session-Cookies werden nicht an SharePoint weitergeleitet.

Ob damit echte Kerberos Constrained Delegation bis SharePoint funktioniert, ist eine Eigenschaft
der IIS-/Proxy-/AD-Konfiguration (SPNs, Delegationsrecht und Double-Hop), nicht des Node-Codes. Das
muss in der Zielumgebung separat getestet werden. Microsoft empfiehlt fuer Double-Hop-Szenarien
Constrained statt Unconstrained Delegation nach dem Least-Privilege-Prinzip
([IIS/Kerberos Double-Hop](https://learn.microsoft.com/en-us/troubleshoot/developer/webapps/iis/www-authentication-authorization/kerberos-double-hop-authentication-edge-chromium)).

## Verbleibende Risiken und Betriebsaufgaben

### npm-Abhaengigkeiten

`npm audit fix` reduzierte den Stand von 16 Befunden (1 kritisch, 7 hoch, 8 moderat) auf 5
Befunde (1 hoch, 4 moderat). Aktualisiert wurden unter anderem `Next.js` auf 14.2.35,
`sanitize-html` auf 2.17.6, `@xmldom/xmldom` auf 0.9.10, `undici` auf 6.27.0 und `jws` auf 3.2.3.

Offen bleiben:

- Next.js 14: ein gebuendelter Audit-Befund mit mehreren Advisories. Ein vollstaendiges Entfernen
  erfordert einen geplanten Major-Upgrade auf eine aktuelle Next.js-Version. Einige gemeldete
  Teilbefunde betreffen App Router, Image Optimizer oder i18n und sind bei diesem Pages-Router-Repo
  mit `images.unoptimized` nicht direkt ausnutzbar; andere DoS-/Request-Smuggling-Befunde muessen
  bis zum Upgrade durch Reverse-Proxy-Limits und Monitoring mitigiert werden.
- `react-quill`/Quill 1: moderater XSS-Befund. Das Repo sanitisiert gerendertes Rich Text zusaetzlich,
  dennoch ist eine Migration auf einen gepflegten Quill-2-kompatiblen Editor erforderlich.
- `uuid` 9: moderater Bounds-Check-Befund betrifft v3/v5/v6 mit vom Aufrufer bereitgestelltem Buffer.
  Das Repo verwendet UUID v4 ohne externen Zielbuffer; ein Major-Upgrade bleibt ein Wartungspunkt.
- `postcss`: moderater Befund in der direkten und der von Next gebuendelten Version; das vollstaendige
  Update ist mit dem Next-/Build-Upgrade zu koordinieren.

### SharePoint-Transport

- Bei gesetztem Service-Benutzer uebergibt der aktuelle Curl-Pfad `Benutzer:Passwort` ueber
  Prozessargumente. Auf Hosts, auf denen andere Benutzer Prozesskommandozeilen lesen duerfen, kann
  dies Zugangsdaten offenlegen. Empfohlen sind ein dediziertes, gehärtetes Dienstkonto, restriktive
  Hostrechte und mittelfristig Kerberos ueber den Prozess-Ticketcache ohne Passwortargument.
- `SP_ALLOW_SELF_SIGNED=true` beziehungsweise `SP_TLS_FALLBACK_INSECURE=true` deaktiviert die
  Zertifikatspruefung. In Produktion stattdessen die interne CA ueber `SP_TRUSTED_CA_PATH`
  bereitstellen.
- Der In-Memory-NTLM-Fallbackstatus ist pro Prozess und verschwindet bei Neustart. Das ist kein
  Sicherheitsproblem, muss aber bei Diagnose und Multi-Instance-Betrieb beruecksichtigt werden.

### Sessionmodell

- Es gibt weiterhin keine serverseitige Revocation-Liste. Ein bereits kopiertes JWT bleibt bis
  zum Ablauf gueltig. Fuer sofortigen Widerruf waere ein serverseitiger Sessionstore mit zufaelliger
  Session-ID erforderlich.
- Gruppen aus Entra werden beim Login erfasst und koennen bis zum naechsten Login veraltet sein.
  Adminrechte werden deshalb live gegen DB/SharePoint geprueft; Lesehinweise koennen weiterhin aus
  Token-Gruppen und Department kommen.

## Deployment-Checkliste

1. Einen zufaelligen `JWT_SECRET` mit mindestens 32 Bytes im Secret Store setzen.
2. `ENTRA_REDIRECT_URI` und `ENTRA_POST_LOGOUT_REDIRECT_URI` als Web-Redirects in Entra registrieren.
3. Reverse Proxy so konfigurieren, dass er `Host`, `X-Forwarded-Host`, `X-Forwarded-Proto` und alle
   delegierten Identitaetsheader bereinigt und kontrolliert neu setzt.
4. Standardmaessig `SP_TRUST_DELEGATED_PROXY=false` lassen.
5. Kerberos-SPNs und Ticketcache testen; wenn erfolgreich, `SP_CURL_NTLM_FALLBACK=false` setzen.
6. Interne CA installieren und unsichere TLS-Fallbacks deaktivieren.
7. Nach Deployment Login, Popup-Login, Query-erhaltenden Return, lokalen Logout, Entra-Logout,
   abgelaufenes JWT, CSRF-Ablehnung sowie SharePoint-Lesen/-Schreiben pro Instanz testen.
8. Den geplanten Next.js-/Editor-Major-Upgrade als separates Security-Update terminieren.

## Verifikation

Die finale Verifikation umfasst:

- TypeScript: `npx tsc --noEmit --pretty false`
- Produktions-Build: `npm run build`
- Format/Diff: `git diff --check`
- Abhaengigkeiten: `npm audit --audit-level=moderate`
- statische Suche nach clientseitigem App-JWT, altem JWT-Fallback und ungeschuetzter Legacy-
  Tokenausstellung

Ergebnis:

- TypeScript-Pruefung: erfolgreich, keine Fehler.
- Produktions-Build mit Next.js 14.2.35: erfolgreich; zwei bereits bestehende Warnungen zu
  unbenutzten Zaehlern in `pages/instances.tsx`, keine Auth-/Security-Warnung.
- Security-Regressionstests: 4/4 erfolgreich (`JWT_SECRET`, TTL, `returnUrl`, CSRF-Origin).
- `git diff --check`: erfolgreich.
- Statische Suche: keine Browserablage (`adminToken`), keine Tokenuebergabe in `AUTH_SUCCESS`, kein
  `#token`-Fragment und kein produktiver bekannter JWT-Fallback mehr. Der bekannte Fallbacktext ist
  nur noch als explizit abgelehnter Wert und als Regressionstest vorhanden.
- npm-Audit nach kompatiblen Updates: 0 kritisch, 1 hoch, 4 moderat; die fuenf verbleibenden
  Pakete sind im Abschnitt "npm-Abhaengigkeiten" bewertet.
- Live-Tenant-/SharePoint-Test: nicht lokal durchgefuehrt; bleibt verpflichtender Deployment-Test.
