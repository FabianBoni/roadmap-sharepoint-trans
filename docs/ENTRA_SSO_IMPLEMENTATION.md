# Microsoft Entra SSO Implementation

Diese Datei beschreibt, wie Microsoft Entra SSO in diesem Repo umgesetzt ist und welche Teile du fuer andere Repos direkt uebernehmen kannst.

## Zielbild

Dieses Repo verwendet **kein NextAuth** und **kein clientseitiges MSAL-Setup**. Stattdessen laeuft der Login als serverseitiger OIDC Authorization Code Flow mit PKCE:

1. Browser startet Login ueber eine interne Next.js API-Route.
2. Die API-Route erzeugt `state`, `nonce` und PKCE-Daten und leitet zu Microsoft Entra weiter.
3. Der Callback tauscht den `code` gegen Tokens, liest das Benutzerprofil ueber Microsoft Graph und signiert daraus ein repo-eigenes JWT.
4. Das Repo verwendet dieses JWT danach fuer seine eigenen API-Guards und Rechtepruefungen.

Wichtig: In diesem Repo sind **Authentifizierung** und **Autorisierung** klar getrennt. Ein erfolgreicher Entra-Login bedeutet nur: "Benutzer ist bekannt". Ob der Benutzer danach Admin- oder Instanzrechte hat, wird erst serverseitig je Request entschieden.

## Architekturueberblick

### 1. Wiederverwendbare Entra-Bausteine

Das Monorepo bringt ein eigenes Workspace-Paket mit:

- [`@roadmap/entra-sso` ueber `packages/entra-sso`](../packages/entra-sso/package.json)
- OIDC/PKCE/Graph-Helfer in [`packages/entra-sso/src/core`](../packages/entra-sso/src/core/index.ts)
- Next.js-Helfer fuer Cookies und Redirect-URIs in [`packages/entra-sso/src/next`](../packages/entra-sso/src/next/index.ts)

Die wichtigsten Bausteine darin:

- [`packages/entra-sso/src/core/oidc.ts`](../packages/entra-sso/src/core/oidc.ts): baut die Authorize-URL und tauscht den Authorization Code gegen Tokens.
- [`packages/entra-sso/src/core/pkce.ts`](../packages/entra-sso/src/core/pkce.ts): erzeugt PKCE `verifier` und `challenge`.
- [`packages/entra-sso/src/core/graph.ts`](../packages/entra-sso/src/core/graph.ts): liest `/me` und optional Gruppen aus Microsoft Graph.
- [`packages/entra-sso/src/next/cookies.ts`](../packages/entra-sso/src/next/cookies.ts): Cookie-Parsing und `Set-Cookie`-Builder.
- [`packages/entra-sso/src/next/redirectUri.ts`](../packages/entra-sso/src/next/redirectUri.ts): berechnet die Callback-URL aus Forwarded-Headern und Base Path.

Das Paket wird in [`next.config.mjs`](../next.config.mjs) ueber `transpilePackages: ['@roadmap/entra-sso']` eingebunden.

### 2. Repo-spezifischer Entra-Wrapper

[`utils/entraSso.ts`](../utils/entraSso.ts) ist die schmale Repo-Schicht ueber dem Paket. Sie kapselt:

- "Ist Entra SSO ueberhaupt konfiguriert?"
- Redirect-URI-Berechnung fuer Next.js Requests
- die lokale Policy `isEntraUserAllowed()`

Aktueller Stand in diesem Repo:

- `isEntraUserAllowed()` ist **offen per Default**.
- Ein Entra-Benutzer gilt als erlaubt, sobald `id`, `userPrincipalName` oder `mail` vorhanden ist.
- Eine feste UPN-Allowlist ist aktuell **nicht aktiv**, auch wenn es im Paket dafuer bereits Helfer gibt.

### 3. App-spezifische Auth-Routen

Die eigentliche Integration lebt in:

- [`pages/api/auth/entra/login.ts`](../pages/api/auth/entra/login.ts)
- [`pages/api/auth/entra/callback.ts`](../pages/api/auth/entra/callback.ts)
- [`pages/api/auth/entra/status.ts`](../pages/api/auth/entra/status.ts)

Diese Routen bilden den eigentlichen Entra-Login fuer die Anwendung.

### 4. Client-Session und Guards

- [`utils/auth.ts`](../utils/auth.ts): speichert das App-JWT im Browser, baut API-URLs mit Instanzkontext und prueft bestehende Sessions.
- [`components/withAdminAuth.tsx`](../components/withAdminAuth.tsx): schuetzt Admin-Seiten im Client.
- [`pages/admin/login.tsx`](../pages/admin/login.tsx): manueller Login mit Popup.
- [`pages/admin/instances.tsx`](../pages/admin/instances.tsx): produktiver Landing-Flow inkl. optionalem Auto-Redirect zu SSO.

### 5. Serverseitige Session- und Rechtepruefung

- [`utils/apiAuth.ts`](../utils/apiAuth.ts): liest das JWT aus `Authorization: Bearer ...` oder aus dem Cookie `roadmap-admin-token`.
- [`pages/api/auth/check-admin-session.ts`](../pages/api/auth/check-admin-session.ts): prueft, ob die Session gueltig ist und ob daraus Admin- oder Superadmin-Rechte abgeleitet werden.
- [`utils/instanceAccessServer.ts`](../utils/instanceAccessServer.ts): entscheidet, ob eine Session fuer eine Instanz lesen oder administrieren darf.
- [`utils/superAdminAccessServer.ts`](../utils/superAdminAccessServer.ts): Superadmin-Aufloesung ueber DB und SharePoint-Fallback.

## End-to-End Flow

### 1. Feature aktivieren / Status pruefen

Der Client prueft zunaechst [`pages/api/auth/entra/status.ts`](../pages/api/auth/entra/status.ts).

Die Route liefert unter anderem:

- ob `ENTRA_TENANT_ID`, `ENTRA_CLIENT_ID` und `ENTRA_CLIENT_SECRET` gesetzt sind
- die berechnete Redirect-URI
- ob `ENTRA_REDIRECT_URI` gesetzt ist und plausibel auf `/api/auth/entra/callback` zeigt

Ausserdem liefert sie derzeit fest `allowlistConfigured: true`. Das bedeutet nicht, dass eine
echte Allowlist konfiguriert ist; die lokale Zulassungsregel ist offen (siehe oben). Die Route gibt
keine Secrets aus.

Das Ergebnis wird im Frontend genutzt, um SSO-Buttons nur dann anzuzeigen, wenn die
Grundkonfiguration vollstaendig ist.

### 2. Login starten

Der Login wird ueber eine interne URL gestartet:

```text
/api/auth/entra/login?returnUrl=/admin/instances
```

Optional gibt es zwei Betriebsarten:

- `popup=1` fuer Popup-Login, z. B. auf [`pages/admin/login.tsx`](../pages/admin/login.tsx)
- Full-Page-Redirect, z. B. auf [`pages/admin/instances.tsx`](../pages/admin/instances.tsx)

Die Route [`pages/api/auth/entra/login.ts`](../pages/api/auth/entra/login.ts) macht dabei Folgendes:

1. Validiert, dass Entra SSO konfiguriert ist.
2. Berechnet die Redirect-URI ueber `ENTRA_REDIRECT_URI` oder aus Request-Origin plus Next.js `basePath`.
3. Erkennt eine typische Fehlkonfiguration: `ENTRA_REDIRECT_URI` zeigt auf eine App-Seite statt auf `/api/auth/entra/callback`.
4. Normalisiert `returnUrl`, damit nur relative Pfade erlaubt sind. Das verhindert Open Redirects.
5. Erzeugt:
   - `state`
   - `nonce`
   - PKCE `verifier`
   - PKCE `challenge`
6. Legt temporaere Cookies fuer den Callback an:
   - `entra_state`
   - `entra_nonce`
   - `entra_pkce_verifier`
   - `entra_return_url`
   - `entra_popup`
7. Leitet zu Microsoft Entra weiter.

Verwendete Scopes:

- `openid`
- `profile`
- `email`
- `User.Read`

Der Login fordert bewusst `prompt=select_account` an.

### 3. Callback verarbeiten

Nach dem Login kommt Microsoft Entra auf [`pages/api/auth/entra/callback.ts`](../pages/api/auth/entra/callback.ts) zurueck.

Die Route:

1. liest die zuvor gesetzten Cookies
2. verlangt `code`, `state`, den passenden `entra_state`-Cookie und den PKCE-Verifier
3. tauscht den Authorization Code gegen Tokens ueber den `/token` Endpoint
4. liest das Profil des angemeldeten Benutzers ueber Graph `/me`
5. versucht zusaetzlich Gruppennamen ueber Graph `me/transitiveMemberOf` zu laden
6. faellt bei fehlenden Graph-Gruppen optional auf die `groups` Claim im ID Token zurueck
7. baut daraus ein anwendungsinternes JWT

Wichtig dabei:

- Der Graph-Gruppenabruf ist **best effort**. Wenn die Tenant-Berechtigungen fehlen, scheitert der Login **nicht**.
- Die eigentliche Freigabe entscheidet **nicht** ueber eine fest verdrahtete Allowlist, sondern spaeter ueber die Repo-spezifische Rechtepruefung.
- `entra_nonce` wird verlangt, in konstanter Zeit mit der validierten `nonce`-Claim verglichen und
  anschliessend in Erfolgs- wie Fehlerfaellen geloescht.
- Das ID-Token wird mit Microsofts OpenID-Metadaten und automatisch rotierenden JWKS validiert.
  Geprueft werden Signatur, Algorithmus (`RS256`), Issuer, Audience, Zeitclaims und `nonce`.

### 4. App-eigenes JWT erzeugen

Die Callback-Route signiert ein eigenes JWT mit [`jsonwebtoken`](../package.json). Das Token enthaelt u. a.:

- `username`
- `displayName`
- `source: 'entra'`
- `groups`
- `entra.id`
- `entra.upn`
- `entra.mail`
- `entra.department`

Wichtige Designentscheidung dieses Repos:

- Das Entra-Callback setzt **`isAdmin: false`**.
- Der Login vergibt also **keine** Admin-Rolle.
- Ob der Benutzer spaeter Admin ist, wird je Request serverseitig berechnet.

Das trennt Login-Identitaet sauber von den eigentlichen Fachrechten.

Signiert wird mit `JWT_SECRET`. Fehlt die Variable, ist sie kuerzer als 32 Zeichen oder enthaelt sie
einen bekannten Platzhalter, verweigert die Authentifizierung den Betrieb. Die JWT-Laufzeit kommt
aus `JWT_EXPIRES_IN` und betraegt standardmaessig `24h`. Es werden keine Entra-Tokens in das App-JWT
aufgenommen.

### 5. Rueckgabe an den Browser

Danach gibt es zwei Pfade:

- Popup-Flow: Der Callback setzt das Session-Cookie und sendet per
  `window.opener.postMessage(...)` nur eine `AUTH_SUCCESS`- oder `AUTH_ERROR`-Nachricht an das
  Hauptfenster. Das JWT wird nicht an JavaScript uebergeben.
- Redirect-Flow: Der Callback setzt das Cookie `roadmap-admin-token` und leitet zur `returnUrl` weiter.

Zusatzinfo:

- Das Cookie `roadmap-admin-token` ist `HttpOnly` und kann nicht von Frontend-JavaScript gelesen
  werden. Das JWT wird nicht mehr in `sessionStorage` gespeichert.
- Das Cookie hat `Path=/`, `SameSite=Lax`, bei HTTPS/Produktion `Secure`; seine Laufzeit wird aus
  derselben validierten `JWT_EXPIRES_IN`-Konfiguration wie die JWT-Ablaufzeit berechnet.
- Die temporaeren Cookies fuer `state`, PKCE-Verifier, Ruecksprungziel und Popup-Modus leben zehn
  Minuten. `state` und Verifier sind `HttpOnly`, Ruecksprungziel und Popup-Flag nicht.

Schreibende Requests mit Cookie-Session werden zentral ueber ihren `Origin` gegen die erwartete
Proxy-Origin geprueft. Das ergaenzt `SameSite=Lax` um einen CSRF-Schutz.

### 6. Client-Session persistieren

[`utils/auth.ts`](../utils/auth.ts) kapselt die Browser-Seite:

- `persistAdminSession(...)` speichert nur noch nicht-sensitive Anzeigeinformationen; das JWT bleibt
  ausschliesslich im serverseitig gesetzten `HttpOnly`-Cookie.
- `hasValidAdminSession()` ruft [`pages/api/auth/check-admin-session.ts`](../pages/api/auth/check-admin-session.ts) auf.
- `buildInstanceAwareUrl()` haengt den aktuellen `roadmapInstance` Kontext an API-Requests an.

Die Session wird ausschliesslich serverseitig verifiziert. Die Session-Statusantwort wird
clientseitig fuer 1,5 Sekunden gecached. Es gibt keinen Refresh-Token-Flow: Nach Ablauf des App-JWT
ist eine neue Anmeldung noetig.

Der letzte Punkt ist in diesem Repo wichtig, weil Rechte nicht nur benutzerbezogen, sondern auch **instanzbezogen** sind.

### 7. Session serverseitig validieren

[`utils/apiAuth.ts`](../utils/apiAuth.ts) liest das JWT serverseitig aus:

- `Authorization: Bearer <token>`
- oder Cookie `roadmap-admin-token`

Der zentrale Extractor ist `extractAdminSession()`.

Er prueft Signatur und Ablaufzeit mit `jwt.verify(..., JWT_SECRET)`. Ein Bearer-Token hat Vorrang
vor dem Cookie. Eine fehlende, ungueltige oder abgelaufene Session ergibt `null`; die aufrufende
Route entscheidet daraus ueber 401/403. `check-admin-session` liefert bei fehlendem Token konkret
HTTP 403, bei gueltigem Token HTTP 200 mit `authenticated`, `isAdmin`, `isSuperAdmin`, Benutzer,
Department und Gruppen.

Viele API-Routen verwenden **nicht** `requireAdminSession()`, sondern `requireUserSession()`. Beispiel:

- [`pages/api/instance-admin-users.ts`](../pages/api/instance-admin-users.ts)

Das ist Absicht: Erst wird die Session bestaetigt, danach wird mit einer zweiten Pruefung entschieden, ob diese Session fuer die konkrete Aktion und Instanz ausreichend ist.

### 8. Autorisierung getrennt aufloesen

Die eigentliche Rechteentscheidung passiert in [`utils/instanceAccessServer.ts`](../utils/instanceAccessServer.ts) und [`utils/superAdminAccessServer.ts`](../utils/superAdminAccessServer.ts).

Die wichtigsten Regeln:

- Superadmin wird zuerst ueber die `SuperAdmin` Tabelle geprueft.
- Falls dort kein Treffer vorliegt, gibt es einen SharePoint-Fallback ueber die Gruppe `superadmin`.
- Instanz-Adminrechte koennen ueber direkte Benutzerfreigaben in der Instanz-Metadatenstruktur kommen.
- Fuer Leserechte koennen auch Department-Zuordnungen relevant sein.
- Als weitere Absicherung prueft das Repo SharePoint-Gruppen wie `admin-<instanceSlug>`.

Token-Gruppen allein vergeben bei einer Admin-Pruefung keine Instanz-Adminrechte, weil sie bis zur
naechsten Anmeldung veraltet sein koennen. Fuer Adminzugriff wird die Mitgliedschaft deshalb live
ueber direkte Instanzfreigaben bzw. SharePoint-Gruppen aufgeloest. Bei reinem Lesezugriff duerfen
Token-Gruppen und Department-Zuordnungen dagegen als Zugriffssignal dienen.

Das bedeutet fuer den Nachbau:

- Entra SSO liefert in diesem Repo nur die **Identitaet**.
- Die **Berechtigung** wird danach ueber eigene Fachlogik entschieden.

## Frontend-Einstiegspunkte

### `pages/admin/login.tsx`

Diese Seite bietet einen manuellen Login mit Popup.

Flow:

1. `GET /api/auth/entra/status`
2. bei Klick: `window.open('/api/auth/entra/login?popup=1&returnUrl=...')`
3. Warten auf `postMessage`
4. `persistAdminSession(...)`
5. Redirect zur Zielseite

### `pages/admin/instances.tsx`

Diese Seite nutzt eher den produktiven Redirect-Flow:

- optionales Auto-Login ueber `NEXT_PUBLIC_ENTRA_AUTO_LOGIN=true`
- Full-Page-Redirect zu `/api/auth/entra/login?returnUrl=...`
- Session-Check ueber `/api/auth/check-admin-session`
- Superadmin-Ermittlung fuer Instanzverwaltung

### `components/withAdminAuth.tsx`

Der HOC schuetzt Admin-Seiten, indem er:

1. einen gueltigen User-Token erwartet
2. den Entra-Callback-Hash konsumieren kann
3. anschliessend per `hasAdminAccessToCurrentInstance()` prueft, ob fuer die aktuelle Instanz Zugriff besteht

## Umgebungsvariablen

Mindestens relevant fuer Entra SSO in diesem Repo:

- `ENTRA_TENANT_ID`
- `ENTRA_CLIENT_ID`
- `ENTRA_CLIENT_SECRET`
- `JWT_SECRET`

Zusaetzlich wichtig:

- `ENTRA_REDIRECT_URI`
  - empfohlen als explizite absolute Callback-URL
  - muss auf `/api/auth/entra/callback` zeigen
- `JWT_EXPIRES_IN`
  - optional, Default: `24h`
- `NEXT_PUBLIC_ENTRA_AUTO_LOGIN`
  - optional fuer automatischen Redirect ins SSO
- `NEXT_PUBLIC_DEPLOYMENT_ENV`
- `NEXT_PUBLIC_BASE_PATH_DEV`
- `NEXT_PUBLIC_BASE_PATH_PROD`

Graph-Rechte in Entra:

- `User.Read` ist faktisch Pflicht, weil das Repo immer `/me` abfragt.
- Fuer Gruppennamen ist zusaetzlich eine passende Gruppen-Leseberechtigung noetig, typischerweise `GroupMember.Read.All` mit Admin Consent.
- Fehlt die Gruppen-Leseberechtigung, bleibt der Login trotzdem funktionsfaehig.

Die Anwendung fordert beim Authorize-Aufruf nur `openid profile email User.Read` an. Eine fuer den
Gruppenabruf erforderliche zusaetzliche delegierte Berechtigung muss daher in der App-Registrierung
vorab genehmigt sein; sie wird nicht explizit als Scope in dieser Login-URL angefordert.

## Logout und Session-Ende

`logout()` in [`utils/auth.ts`](../utils/auth.ts) navigiert zur serverseitigen Logout-Route. Diese
loescht das `HttpOnly`-App-Cookie und leitet anschliessend zum tenant-spezifischen Microsoft-
Logout-Endpunkt weiter. Danach geht es zur konfigurierten `ENTRA_POST_LOGOUT_REDIRECT_URI` oder zur
lokalen Login-Seite zurueck. Mit `?local=1` kann bewusst nur die lokale App-Session beendet werden.

Es gibt in diesem Repo keine Refresh-Token-Speicherung, keine serverseitige Session-Datenbank und
keine Token-Revocation-Liste. Eine bereits ausgestellte App-Session endet durch Logout im Browser,
durch Ablauf des JWT oder durch Wechsel von `JWT_SECRET`; nachtraegliche Rechteaenderungen wirken
bei den live aufgeloesten DB-/SharePoint-Rechten bereits beim naechsten Request.

## Auditierte Sicherheits- und Implementierungsgrenzen

> **Status:** Die nachfolgend erklaerten sieben Befunde waren der Ausgangszustand des Audits und
> wurden im Code geschlossen. Der vollstaendige Nachweis, die geaenderten Dateien, Tests und
> verbleibenden Restrisiken stehen in
> [`SSO_SECURITY_AUDIT_REPORT.md`](./SSO_SECURITY_AUDIT_REPORT.md). Die Erklaerungen bleiben als
> Entwicklerreferenz erhalten und beschreiben unter **Was bedeutet das?** jeweils den Zustand vor
> der Behebung.

Die folgenden Punkte beschreiben den aktuellen Code, nicht automatisch einen bereits erfolgten
Angriff. Einige sind konkrete Sicherheitsrisiken, andere vor allem inkonsistentes oder fuer Benutzer
ueberraschendes Verhalten. Die Erklaerungen richten sich bewusst an Applikationsentwickler.

### 1. Der Entra-`nonce` wird nicht validiert und nicht geloescht

**Was bedeutet das?** Beim Start der Anmeldung erzeugt die Anwendung eine einmalige Zufallszahl
(`nonce`), legt sie im Cookie `entra_nonce` ab und sendet sie an Entra. Entra schreibt diesen Wert in
das ID-Token. Der Callback liest den Cookie aktuell jedoch nicht und vergleicht ihn nicht mit der
`nonce`-Claim des ID-Tokens. Der Cookie wird nach dem Callback ebenfalls nicht geloescht.

**Warum ist das ein Risiko?** Der `nonce` soll ein ID-Token eindeutig mit genau dem Login-Vorgang
verbinden, den dieser Browser begonnen hat. Ohne Vergleich fehlt diese Schutzschicht gegen das
Wiederverwenden oder Unterschieben eines ID-Tokens aus einem anderen Login-Vorgang. `state` und
PKCE sind bereits vorhanden und schuetzen andere Teile des Flows, ersetzen die ID-Token-`nonce`
aber nicht. Der nicht geloeschte Cookie ist zusaetzlich irrefuehrender Altzustand und bleibt ueber
den abgeschlossenen Vorgang hinaus im Browser.

**Wie beheben?** In
[`pages/api/auth/entra/callback.ts`](../pages/api/auth/entra/callback.ts) muss der Callback:

1. `entra_nonce` aus den Cookies lesen und sein Vorhandensein verlangen,
2. das ID-Token kryptografisch validieren (siehe naechster Punkt),
3. die validierte `nonce`-Claim mit dem Cookie-Wert in konstanter Zeit vergleichen und bei einer
   Abweichung den Login abbrechen,
4. `entra_nonce` sowohl nach Erfolg als auch in jedem Fehlerpfad mit `Max-Age=0` loeschen.

Die `nonce` sollte nicht aus einem lediglich dekodierten, unvalidierten Token verglichen werden,
weil ein Angreifer dessen Claims selbst schreiben koennte.

### 2. Das ID-Token wird nicht kryptografisch validiert

**Was bedeutet das?** `parseJwtPayload()` zerlegt das ID-Token und dekodiert seinen JSON-Inhalt.
Das ist vergleichbar mit dem Lesen eines Dokuments, ohne Unterschrift und Aussteller zu pruefen.
Der Code uebernimmt daraus derzeit `department` und ersatzweise `groups`. Die primaere Identitaet
kommt zwar aus Graph `/me`, wodurch die unmittelbare Auswirkung reduziert wird; die Zusatzclaims
koennen aber in spaetere Zugriffsentscheidungen einfliessen.

**Warum ist das ein Risiko?** Ohne Validierung weiss die Anwendung nicht sicher, ob das Token von
Microsoft fuer genau diese Anwendung und diesen Tenant ausgestellt wurde und noch gueltig ist.
Insbesondere werden Signatur, `iss` (Aussteller), `aud` (Client-ID), `exp` (Ablaufzeit) und `nonce`
nicht geprueft. Manipulierte Department- oder Gruppenwerte koennten dadurch als Zugriffsindikator
verwendet werden. Dass der Code vom echten Token-Endpoint und Graph aufgerufen wird, senkt das
praktische Risiko, ist aber kein Ersatz fuer die vorgesehene OIDC-Validierung.

**Wie beheben?** Eine etablierte OIDC/JWT-Bibliothek wie `jose` verwenden und die Microsoft-
Signaturschluessel ueber die OpenID-Connect-Metadaten beziehungsweise JWKS des konfigurierten
Tenants laden. Bei der Verifikation mindestens Folgendes fest vorgeben:

- erwarteter Issuer des konfigurierten `ENTRA_TENANT_ID`,
- erwartete Audience `ENTRA_CLIENT_ID`,
- gueltige Signatur und Zeitclaims (`exp`, gegebenenfalls `nbf`),
- erwartete `nonce` aus dem Cookie.

Erst Claims aus dem erfolgreich validierten Ergebnis verwenden. Alternativ sollten `department`
und Gruppen ausschliesslich aus dem mit dem Access-Token aufgerufenen Graph gelesen und Claims aus
dem ID-Token gar nicht verwendet werden. Eine selbst geschriebene Signaturpruefung ist hier nicht
empfehlenswert, weil Schluesselrotation und Claim-Regeln leicht unvollstaendig umgesetzt werden.

### 3. Das App-JWT ist fuer JavaScript lesbar

**Was bedeutet das?** Das interne App-JWT liegt in `sessionStorage` und im nicht-`HttpOnly` Cookie
`roadmap-admin-token`. Das Frontend liest es und setzt es als Bearer-Token in API-Aufrufen ein.

**Warum ist das ein Risiko?** JavaScript, das innerhalb der Anwendungsseite ausgefuehrt wird, kann
beide Speicherorte auslesen. Falls irgendwo eine Cross-Site-Scripting-Luecke (XSS) entsteht, kann
eingeschleuster Code das JWT kopieren und an einen Angreifer senden. Dieser kann es bis zum Ablauf
ausserhalb des urspruenglichen Browsers als angemeldeter Benutzer verwenden. `sessionStorage`
begrenzt die Lebensdauer auf den Tab, verhindert das Auslesen durch XSS aber nicht.

**Wie beheben?** Bevorzugt auf eine reine Cookie-Session umstellen:

- Das App-JWT nur in einem Cookie mit `HttpOnly`, `Secure` und `SameSite=Lax` oder `Strict` ablegen.
- Das Token nicht mehr in `sessionStorage` speichern und nicht mehr mit JavaScript auslesen.
- Interne Requests senden das Cookie automatisch; `utils/apiAuth.ts` unterstuetzt Cookie-Tokens
  bereits.
- Fuer zustandsaendernde Requests zusaetzlich CSRF-Schutz vorsehen, beispielsweise SameSite plus
  Origin-Pruefung oder ein CSRF-Token. `HttpOnly` schuetzt vor dem Auslesen, nicht vor dem Ausloesen
  eines Requests aus dem Browser des Opfers.

Ergaenzend bleiben konsequentes Output-Escaping, eine restriktive Content Security Policy und das
Vermeiden unsicherer HTML-Injektion wichtig. Diese Massnahmen reduzieren XSS; sie ersetzen den
Schutz des Session-Tokens nicht.

### 4. Ein bekannter Fallback fuer `JWT_SECRET` ist eingebaut

**Was bedeutet das?** Fehlt `JWT_SECRET`, signiert und prueft die Anwendung Tokens mit dem im
Quellcode sichtbaren Text `roadmap-secret-change-in-production`.

**Warum ist das ein hohes Risiko?** Jeder mit Zugriff auf das Repository kennt diesen Schluessel
und kann selbst gueltig signierte App-JWTs mit beliebigen Benutzerdaten erzeugen. In einer falsch
konfigurierten produktiven Instanz waere damit die Authentifizierung praktisch umgehbar.

**Wie beheben?** Den Fallback entfernen und die Anwendung beim Start beziehungsweise spaetestens
beim ersten Auth-Aufruf mit einer klaren Fehlermeldung abbrechen, wenn `JWT_SECRET` fehlt oder zu
kurz ist. Fuer Produktion einen kryptografisch zufaelligen Wert mit mindestens 32 Bytes aus dem
Secret Store der Deployment-Plattform injizieren. Der Wert darf weder in Git noch in Logs landen.
Alle gleichzeitig laufenden Instanzen muessen denselben Schluessel verwenden. Eine Rotation macht
bereits ausgestellte Tokens ungueltig und sollte deshalb als geplanter Session-Reset erfolgen.

### 5. Cookie- und JWT-Laufzeit koennen voneinander abweichen

**Was bedeutet das?** Die Laufzeit des signierten JWT wird mit `JWT_EXPIRES_IN` konfiguriert. Der
Callback setzt fuer das Cookie dagegen immer `Max-Age=86400`, also 24 Stunden.

**Warum ist das problematisch?** Ist das JWT kuerzer gueltig, sendet der Browser noch ein bereits
abgelaufenes Cookie und der Benutzer erlebt unerwartete 401/403-Antworten. Ist das JWT laenger
gueltig, entfernt der Browser das Cookie zu frueh. Eine eventuell noch vorhandene Kopie in
`sessionStorage` verhaelt sich dann anders. Das ist primaer ein Zuverlaessigkeits- und
Konfigurationsrisiko; zu lange Laufzeiten vergroessern ausserdem das Zeitfenster fuer ein
gestohlenes Token.

**Wie beheben?** Eine einzige kanonische Session-Laufzeit in Sekunden definieren und daraus sowohl
JWT `expiresIn` als auch Cookie `Max-Age` erzeugen. Alternativ nach dem Signieren die `exp`-Claim
auslesen und `Max-Age` als `exp - aktuelleZeit` setzen. Ungueltige Konfigurationswerte muessen zum
Start abgelehnt werden. Eine fuer die Anwendung angemessene kurze Laufzeit festlegen; falls lange
Sitzungen benoetigt werden, einen bewusst entworfenen Refresh-/Session-Mechanismus verwenden statt
einfach nur die Lebensdauer des Bearer-Tokens zu verlaengern.

### 6. `returnUrl` verliert Query-Parameter

**Was bedeutet das?** Die aktuelle Normalisierung erlaubt nur lokale Pfade mit genau einem
fuehrenden `/` und verhindert damit Open Redirects. Danach schneidet sie jedoch alles ab dem ersten
`?` ab. Aus `/admin/projekte?filter=aktiv` wird somit `/admin/projekte`.

**Warum ist das problematisch?** Das Abschneiden ist fuer sich genommen keine Sicherheitsluecke,
sondern eine Implementierungsgrenze. Benutzer verlieren nach dem Login Filter, Ziel-IDs oder andere
Navigationsparameter. Entwickler koennten versucht sein, die Pruefung komplett zu lockern und damit
versehentlich wieder externe Redirects wie `//evil.example` oder eine fremde absolute URL zulassen.

**Wie beheben?** Query-Parameter erhalten, aber das Ziel weiterhin strikt lokal validieren. Den Wert
beispielsweise mit `new URL(returnUrl, festeInterneOrigin)` parsen und nur akzeptieren, wenn:

- der Originalwert mit `/`, aber nicht mit `//` oder `\\` beginnt,
- das geparste Protokoll und der Host exakt der festen internen Origin entsprechen,
- der Pfad optional in einer erlaubten Liste liegt.

Danach `pathname + search + hash` als Ruecksprungziel verwenden. Niemals die Origin aus einem
beliebigen `Host`-Header als Vertrauensanker fuer diese Pruefung verwenden. Die gleiche zentrale
Hilfsfunktion muss in Login und Callback benutzt werden, damit beide Routen identisch entscheiden.

### 7. Logout beendet die Microsoft-Sitzung nicht

**Was bedeutet das?** `logout()` loescht nur das lokale App-JWT. Die Sitzung bei Microsoft Entra
bleibt bestehen; es findet kein Aufruf des Entra-End-Session-Endpunkts statt.

**Warum ist das ein Risiko?** Auf einem gemeinsam verwendeten oder unbeaufsichtigten Geraet kann
der naechste Benutzer die Anwendung erneut oeffnen und wegen der noch aktiven Microsoft-Sitzung
schneller wieder angemeldet werden. `prompt=select_account` zeigt zwar eine Kontoauswahl, beendet
die vorhandene Sitzung aber nicht. Aus Benutzersicht bedeutet "Abmelden" damit nicht zwingend,
dass die zentrale Anmeldung beendet wurde.

**Wie beheben?** Zwei bewusst benannte Varianten anbieten:

- **Nur von dieser Anwendung abmelden:** lokales Cookie serverseitig mit denselben Attributen und
  `Max-Age=0` loeschen. Das ist oft das gewuenschte Standardverhalten.
- **Vollstaendig bei Microsoft abmelden:** nach dem lokalen Loeschen zum Logout-Endpunkt des
  konfigurierten Entra-Tenants weiterleiten und eine vorregistrierte
  `post_logout_redirect_uri` angeben. Den Endpunkt aus den OpenID-Connect-Metadaten beziehen.

Ein zentraler Logout garantiert nicht, dass ein bereits kopiertes App-JWT sofort unbrauchbar wird.
Wenn sofortige serverseitige Sperrung gefordert ist, braucht die Anwendung zusaetzlich kurze
Token-Laufzeiten oder serverseitig widerrufbare Sessions beziehungsweise eine Revocation-Liste.

## CI/CD und Deployment

Die Workflows injizieren Entra-Secrets explizit in die erzeugte `.env` Datei:

- [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)
- [`.github/workflows/branch-build.yml`](../.github/workflows/branch-build.yml)

Wichtige Details aus den Workflows:

- Bereits vorhandene `ENTRA_*` Werte werden vor dem Anhaengen entfernt.
- Dadurch gibt es keine stillen Doppeldefinitionen in `.env`.
- `deploy.yml` nutzt `ENTRA_REDIRECT_URI`.
- `branch-build.yml` nutzt `TEST_ENTRA_REDIRECT_URI`.

Das ist wichtig, weil die Redirect-URI in Reverse-Proxy-Setups schnell die haeufigste Fehlerquelle ist.

## Nachbau in einem anderen Repo

Wenn du das Muster uebernehmen willst, kopiere nicht blind die komplette Auth-Logik. Uebernimm die Struktur in Schichten:

### 1. Generische OIDC-Schicht

Uebernehmen oder neu bauen:

- PKCE-Erzeugung
- Authorize-URL Builder
- Token-Exchange
- Redirect-URI-Aufloesung hinter Reverse Proxy
- Cookie-Utilities fuer `state`, `nonce`, `verifier`, `returnUrl`

### 2. App-spezifische Callback-Schicht

Im Ziel-Repo individuell definieren:

- welche Claims aus Entra uebernommen werden
- ob du Graph `/me` brauchst
- ob du Gruppen live ueber Graph laedst
- wie dein internes App-Token aussieht

### 3. Session-Schicht

Entscheide frueh, welches Modell du willst:

- eine `HttpOnly` Cookie-Session ohne clientseitiges Token-Lesen, wie in diesem Repo
- oder ein bewusst abgesichertes alternatives Session-Modell

### 4. Autorisierung getrennt halten

Das ist die wichtigste Lehre aus diesem Repo:

- Login prueft Identitaet.
- Rollen und Fachrechte werden spaeter separat aufgeloest.

Das macht die Integration robuster, wenn Rollen aus Datenbank, SharePoint, Fachsystemen oder Instanzkonfiguration kommen.

### 5. Robustheit von Anfang an einbauen

Diese Schutzmassnahmen aus dem Repo solltest du mitnehmen:

- `returnUrl` nur als relativen Pfad erlauben
- Redirect-URI aktiv auf Callback-Route validieren
- `state` und PKCE immer serverseitig pruefen
- Gruppenabruf nur "best effort" behandeln
- Duplicate-Env-Werte in CI bereinigen
- `x-forwarded-proto` und `x-forwarded-host` fuer Redirects und Secure Cookies beruecksichtigen

## Was repo-spezifisch ist

Folgende Teile solltest du **nicht** 1:1 in ein anderes Repo kopieren, ohne sie bewusst anzupassen:

- SharePoint-Fallback fuer `superadmin` und `admin-<instanceSlug>` Gruppen
- Instanzmodell mit `roadmapInstance`
- Department-basierte Leserechte
- die aktuelle Policy "jeder erfolgreiche Entra-Login ist zulaessig"
- die Cookie-Session und ihre CSRF-/Origin-Policy

## Kurzfassung

Wenn du nur das Kernmuster uebernehmen willst, ist es dieses:

1. Next.js API-Route fuer Entra Login bauen.
2. `state` plus PKCE in Cookies halten.
3. Callback gegen Entra `/token` austauschen.
4. Graph `/me` lesen.
5. Eigenes App-JWT signieren.
6. Session im Browser oder Cookie persistieren.
7. Rechte erst danach serverseitig aus deinen echten Fachregeln ableiten.

Genau diese Trennung macht die SSO-Integration dieses Repos gut wiederverwendbar.
