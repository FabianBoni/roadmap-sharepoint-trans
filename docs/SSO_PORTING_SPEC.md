# Microsoft Entra SSO – Portierungsspezifikation

Stand: 23.07.2026, abgeglichen mit dem aktuellen Arbeitsbaum auf Basis der
Repository-Revision `4b9699d`.

Diese Datei ist der kanonische technische Übergabevertrag für Menschen und LLMs, die die hier
implementierte Microsoft-Entra-Anmeldung in eine andere Anwendung übertragen sollen. Sie
beschreibt den aktuellen Codezustand, die verbindlichen Sicherheitsinvarianten, die bewusst
anwendungsspezifischen Teile und die Nachweise, die vor Abschluss einer Portierung erbracht werden
müssen.

Die ausführliche Entstehungs- und Audit-Historie steht in
[`ENTRA_SSO_IMPLEMENTATION.md`](./ENTRA_SSO_IMPLEMENTATION.md) und
[`SSO_SECURITY_AUDIT_REPORT.md`](./SSO_SECURITY_AUDIT_REPORT.md). Bei Widersprüchen zwischen
historischen Erläuterungen und dieser Spezifikation ist der aktuelle Quellcode maßgeblich.

## 1. Auftrag für eine implementierende KI

Eine Portierung gilt nur dann als äquivalent, wenn sie alle folgenden Eigenschaften bewahrt:

1. Microsoft Entra wird über den serverseitigen OIDC Authorization Code Flow mit PKCE verwendet.
2. `state`, PKCE und die ID-Token-`nonce` werden geprüft.
3. Das ID-Token wird kryptografisch gegen die OpenID-Metadaten und JWKS des konfigurierten Tenants
   validiert.
4. Entra-Tokens werden weder an Browser-JavaScript ausgegeben noch dauerhaft gespeichert.
5. Nach erfolgreicher Anmeldung wird eine eigene, kurzlebige Anwendungssession in einem
   `HttpOnly`-Cookie ausgestellt.
6. Authentifizierung und Autorisierung bleiben getrennt. Ein erfolgreicher Login vergibt nicht
   automatisch Adminrechte.
7. Schreibende Cookie-Requests besitzen zusätzlich zu `SameSite=Lax` eine serverseitige
   Origin-Prüfung.
8. Rücksprungziele sind ausschließlich lokale relative URLs.
9. Frontend-Guards dienen nur der Benutzerführung. Jede geschützte API erzwingt ihre Rechte selbst.
10. Fehlerpfade löschen alle temporären Login-Cookies.

Wenn die Zielanwendung ein anderes Framework verwendet, dürfen Routing-, Cookie- und
Persistenzadapter ausgetauscht werden. Die Protokoll- und Sicherheitsinvarianten dürfen nicht
abgeschwächt werden.

## 2. Systemgrenze und Architektur

Die aktuelle Anwendung verwendet weder NextAuth/Auth.js noch MSAL im Browser. Der Browser kennt
weder Client Secret noch Entra-Access-Token noch das eigene Session-JWT.

```text
Browser
  │ GET /api/auth/entra/login
  ▼
Roadmap-Server ── authorize redirect + PKCE ──► Microsoft Entra
  ▲                                             │
  │ GET /api/auth/entra/callback?code&state     │
  └─────────────────────────────────────────────┘
  │ serverseitiger Token-Austausch
  │ ID-Token-Validierung über OIDC Metadata/JWKS
  │ Graph /me und optional Gruppen
  │ eigenes HS256-JWT in HttpOnly-Cookie
  ▼
Browser ── Cookie automatisch ──► Session-API ──► fachliche Rechteprüfung
```

Die Implementierung besteht aus vier Schichten:

| Schicht            | Aufgabe                                                       | Aktuelle Quellen                                                                                                                                                                        |
| ------------------ | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OIDC-Kern          | PKCE, Authorize-URL, Token-Austausch, ID-Token-Prüfung, Graph | [`packages/entra-sso/src/core`](../packages/entra-sso/src/core)                                                                                                                         |
| Next.js-Adapter    | Cookies, Proxy-Origin, Base Path, generische Handler          | [`packages/entra-sso/src/next`](../packages/entra-sso/src/next)                                                                                                                         |
| App-Integration    | Login, Callback, Status und Logout                            | [`pages/api/auth/entra`](../pages/api/auth/entra)                                                                                                                                       |
| Session und Rechte | App-JWT, CSRF, Admin-/Superadmin-/Instanzrechte               | [`utils/apiAuth.ts`](../utils/apiAuth.ts), [`utils/instanceAccessServer.ts`](../utils/instanceAccessServer.ts), [`utils/superAdminAccessServer.ts`](../utils/superAdminAccessServer.ts) |

Wichtig: Die produktiven Routen implementieren den Callback bewusst selbst. Die generischen
Factories in [`packages/entra-sso/src/next/handlers.ts`](../packages/entra-sso/src/next/handlers.ts)
bilden den Grundflow ab, übernehmen aber nicht die Roadmap-spezifische Gruppen-, Department- und
JWT-Logik. Sie dürfen nicht ohne Abgleich als vollständiger Ersatz eingesetzt werden.

## 3. Externe Microsoft-Entra-Konfiguration

Für die aktuelle Architektur wird eine App Registration in genau einem Tenant benötigt.

### 3.1 App Registration

Die Zielanwendung muss in Microsoft Entra als vertrauliche Webanwendung registriert werden:

- Plattform: `Web`
- Redirect URI: exakt die öffentlich erreichbare Callback-URL, beispielsweise
  `https://example.org/roadmap/api/auth/entra/callback`
- Client Secret: serverseitig erzeugen und ausschließlich im Secret Store hinterlegen
- Supported account type: Single Tenant, weil ein konkreter `ENTRA_TENANT_ID` verwendet wird
- Frontend-Origin ist keine SPA-Redirect-URI; der Code-Austausch erfolgt auf dem Server

Die Redirect URI muss Zeichen für Zeichen mit dem Wert im Token-Austausch übereinstimmen. Scheme,
Host, Port, Base Path und Callback-Pfad sind relevant.

### 3.2 Delegierte Microsoft-Graph-Rechte

Verbindlich:

- `User.Read`, da der Callback immer `GET /v1.0/me` aufruft

Optional für Gruppennamen:

- typischerweise `GroupMember.Read.All` mit Admin Consent

Laut aktueller Microsoft-Graph-Dokumentation ist `User.Read` bereits die kleinste delegierte
Berechtigung für `/me/transitiveMemberOf`. Ohne weitergehende Leserechte können zurückgegebene
Gruppenobjekte jedoch nur eingeschränkte Informationen enthalten; insbesondere kann der vom
aktuellen Code benötigte `displayName` fehlen. `GroupMember.Read.All` ist deshalb für verlässliche
Gruppennamen sinnvoll, aber nicht Voraussetzung für den Login selbst.

Die Authorize-URL fordert aktuell nur `openid profile email User.Read` an. Der Gruppenabruf ist Best
Effort. Sind keine Gruppennamen verfügbar, bleibt die Anmeldung funktionsfähig; die Anwendung fällt
gegebenenfalls auf eine vorhandene `groups`-Claim des validierten ID-Tokens zurück.

Offizielle Referenzen:

- [Microsoft: Authorization Code Flow mit PKCE](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow)
- [Microsoft: Redirect-URI-Konfiguration](https://learn.microsoft.com/en-us/entra/identity-platform/reply-url)
- [Microsoft Graph: transitive Gruppenmitgliedschaften](https://learn.microsoft.com/en-us/graph/api/user-list-transitivememberof?view=graph-rest-1.0)
- [Microsoft: OpenID Connect und Logout](https://learn.microsoft.com/en-us/entra/identity-platform/v2-protocols-oidc)

## 4. Abhängigkeiten und Build-Integration

Die aktuelle Next.js-Anwendung benötigt:

```json
{
  "dependencies": {
    "jose": "^6.1.3",
    "jsonwebtoken": "^9.0.2"
  }
}
```

- `jose` validiert das von Entra ausgestellte ID-Token gegen Remote-JWKS.
- `jsonwebtoken` signiert und prüft das interne Anwendungstoken.
- Kryptografisch sichere Zufallswerte und SHA-256 kommen aus Node `crypto`.

Microsoft empfiehlt für neue Anwendungen grundsätzlich eine unterstützte Authentifizierungs-
bibliothek statt selbst gebauter Protokollrequests. Wird in der Zielplattform eine solche Bibliothek
verwendet, muss sie dennoch alle in dieser Spezifikation genannten Session-, Cookie-, CSRF- und
Autorisierungsverträge erfüllen.

Das lokale Workspace-Paket `@roadmap/entra-sso` wird über `transpilePackages` und TypeScript-Path-
Aliases eingebunden. In einem anderen Repository kann der Ordner als internes Paket übernommen
oder seine Module können in die Zielanwendung integriert werden.

## 5. Umgebungsvariablen

### 5.1 Verbindlich

```dotenv
ENTRA_TENANT_ID=<tenant-guid>
ENTRA_CLIENT_ID=<application-client-id>
ENTRA_CLIENT_SECRET=<secret-value>
ENTRA_REDIRECT_URI=https://example.org/base/api/auth/entra/callback
JWT_SECRET=<mindestens-32-zufaellige-zeichen>
```

`JWT_SECRET` wird abgelehnt, wenn es fehlt, kürzer als 32 Zeichen ist oder einem bekannten
Placeholder entspricht. Alle Replikate der Anwendung müssen dasselbe Secret verwenden, solange
eine Session über Instanzen hinweg gültig bleiben soll.

### 5.2 Optional

```dotenv
JWT_EXPIRES_IN=8h
JWT_ISSUER=roadmap-sharepoint
JWT_AUDIENCE=roadmap-web
JWT_SESSION_VERSION=1
ENTRA_POST_LOGOUT_REDIRECT_URI=https://example.org/base/admin/login
NEXT_PUBLIC_ENTRA_AUTO_LOGIN=false
NEXT_PUBLIC_DEPLOYMENT_ENV=production
NEXT_PUBLIC_BASE_PATH_PROD=/base
NEXT_PUBLIC_BASE_PATH_DEV=
SUPERADMIN_INSTANCE_SLUGS=all
```

- `JWT_EXPIRES_IN` akzeptiert positive Ganzzahlen mit optionalem Suffix `s`, `m`, `h` oder `d`.
  Ohne Suffix wird der Wert als Sekunden interpretiert. Default ist `8h`, Maximum `12h`.
- `ENTRA_POST_LOGOUT_REDIRECT_URI` muss absolut sein und HTTP oder HTTPS verwenden. Sie muss
  außerdem als Redirect URI der Entra App Registration registriert sein, wenn sie als
  `post_logout_redirect_uri` an Microsoft übergeben wird.
- In Produktion ist `ENTRA_REDIRECT_URI` verbindlich. Nur in Entwicklung darf die Anwendung eine
  Loopback-Origin beziehungsweise die feste `APP_ORIGIN` verwenden; Request-Host- und
  Forwarded-Header sind niemals Vertrauensanker.
- `SUPERADMIN_INSTANCE_SLUGS` gehört zur Roadmap-Autorisierung, nicht zum OIDC-Protokoll.

### 5.3 Aktuell nicht wirksam

`ENTRA_ADMIN_UPNS` und `ENTRA_ALLOW_ALL` stehen aus historischen Gründen in älteren Konfigurationen,
werden von der aktuellen App-Integration aber nicht ausgewertet. Die aktuelle Login-Policy erlaubt
jede eindeutig ermittelte Entra-Identität. Eine Portierung darf diese Variablen nicht versehentlich
als vorhandene Sicherheitsgrenze behandeln.

## 6. Verbindliche Datenverträge

### 6.1 Temporäre Cookies

| Cookie                | Inhalt                        | HttpOnly | Max-Age | Zweck                            |
| --------------------- | ----------------------------- | -------: | ------: | -------------------------------- |
| `entra_state`         | 32 zufällige Bytes, Base64URL |       ja |   600 s | Bindet Callback an Login-Vorgang |
| `entra_nonce`         | 32 zufällige Bytes, Base64URL |       ja |   600 s | Bindet ID-Token an Login-Vorgang |
| `entra_pkce_verifier` | 48 zufällige Bytes, Base64URL |       ja |   600 s | PKCE Code Verifier               |
| `entra_return_url`    | normalisierter lokaler Pfad   |       ja |   600 s | Ziel nach Login                  |
| `entra_popup`         | `1` oder `0`                  |       ja |   600 s | Popup-/Redirect-Modus            |

Alle Cookies verwenden `Path=/` und `SameSite=Lax`. In Produktion wird `Secure` unabhängig von
Client- oder Forwarded-Headern gesetzt. Alle fünf Cookies werden im Callback bei Erfolg und bei
jedem erkannten Fehler mit `Max-Age=0` gelöscht.

`return_url` und `popup` werden ausschließlich serverseitig ausgewertet und sind deshalb ebenfalls
`HttpOnly`.

### 6.2 Anwendungssession

Cookie:

```text
roadmap-admin-token=<signed-app-jwt>; Path=/; Max-Age=<session-ttl>; HttpOnly; SameSite=Lax; Secure
```

`Secure` gilt nach derselben Regel wie oben. Es wird kein Cookie-`Domain` gesetzt. Das Token wird
nicht in `localStorage` oder `sessionStorage` gespeichert.

Aktueller JWT-Payload:

```ts
type AppSession = {
  username: string; // bevorzugt userPrincipalName, dann mail
  displayName: string;
  isAdmin: false; // absichtlich immer false beim Login
  source: 'entra';
  groups: string[]; // Graph-Anzeigenamen oder ID-Token-Gruppenclaim
  entra: {
    id?: string;
    tenantId?: string;
    upn?: string;
    mail?: string;
    department?: string;
    onPremisesSamAccountName?: string;
    onPremisesDomainName?: string;
    onPremisesUserPrincipalName?: string;
  };
  sessionVersion: string;
  jti: string;
  iat: number;
  exp: number;
};
```

Es werden weder `access_token`, `id_token`, `refresh_token` noch Client Secret in dieses JWT
aufgenommen. Das interne JWT wird symmetrisch mit `JWT_SECRET` signiert. Seine `jti` muss zusätzlich
als aktive, nicht widerrufene und nicht abgelaufene Zeile in `AuthSession` vorhanden sein.

### 6.3 Session-Statusantwort

`GET /api/auth/check-admin-session` liefert bei gültiger Identität:

```json
{
  "authenticated": true,
  "isAdmin": true,
  "isSuperAdmin": false,
  "username": "Display Name",
  "department": "Department or null",
  "groups": ["group display name"]
}
```

`isAdmin` und `isSuperAdmin` stammen nicht aus dem beim Login gesetzten `isAdmin`-Claim, sondern
aus der aktuellen serverseitigen Fachprüfung.

## 7. HTTP-Endpunkte

| Route                           | Methode | Authentifizierung   | Verhalten                                                  |
| ------------------------------- | ------- | ------------------- | ---------------------------------------------------------- |
| `/api/auth/entra/status`        | GET     | öffentlich          | Liefert ausschließlich `{ "enabled": boolean }`            |
| `/api/auth/entra/login`         | GET     | öffentlich          | Erzeugt Login-Transaktion und leitet zu Entra              |
| `/api/auth/entra/callback`      | GET     | Transaktionscookies | Tauscht Code, validiert Token, setzt App-Session           |
| `/api/auth/entra/logout`        | POST    | Cookie optional     | Widerruft Session, löscht Cookie, startet zentralen Logout |
| `/api/auth/check-admin-session` | GET     | App-Cookie/Bearer   | Prüft Identität und berechnet aktuelle Rollen              |
| `/api/auth/whoami`              | GET     | App-Cookie/Bearer   | Diagnoseantwort mit Identität und Rollen                   |

Legacy-Routen `login-popup` und `create-token` liefern absichtlich HTTP 410. Eine neue Anwendung darf
keinen Endpunkt übernehmen, der Browser-gelieferte Identitäts- oder Gruppendaten in ein signiertes
Token umwandelt.

## 8. Exakter Login-Flow

### 8.1 Start

Beispiel:

```text
GET /api/auth/entra/login?returnUrl=/admin/instances&popup=1
```

Der Handler muss:

1. ausschließlich GET erlauben;
2. Entra-Konfiguration und `JWT_SECRET` validieren;
3. die Callback-URI bestimmen und als absolute HTTP(S)-URL prüfen;
4. eine konfigurierte Redirect URI ablehnen, wenn ihr Pfad nicht
   `/api/auth/entra/callback` enthält;
5. `returnUrl` mit der zentralen Local-URL-Policy normalisieren;
6. `state`, `nonce` und PKCE-Paar kryptografisch zufällig erzeugen;
7. die temporären Cookies setzen;
8. mit HTTP 302 zur Entra-Authorize-URL weiterleiten.

Die Authorize-URL lautet strukturell:

```text
https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/authorize
  ?client_id={clientId}
  &response_type=code
  &redirect_uri={exactCallbackUri}
  &response_mode=query
  &scope=openid%20profile%20email%20User.Read
  &state={state}
  &nonce={nonce}
  &code_challenge={base64url(sha256(verifier))}
  &code_challenge_method=S256
  &prompt=select_account
```

### 8.2 Rücksprungziel validieren

Ein gültiges Ziel:

- beginnt mit genau einem `/`;
- ist kein Protokoll-relativer Pfad `//...`;
- enthält keinen Backslash;
- enthält keine Steuerzeichen;
- bleibt auch nach `decodeURIComponent` lokal;
- ergibt gegen eine feste Dummy-Origin geparst dieselbe Origin.

Ausgegeben wird ausschließlich `pathname + search + hash`. Bei jedem Fehler wird `/admin`
verwendet. Login und Callback müssen dieselbe Funktion benutzen.

### 8.3 Token-Austausch

Der Callback sendet serverseitig einen form-urlencodierten POST an:

```text
https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token
```

Body:

```text
client_id={clientId}
client_secret={clientSecret}
grant_type=authorization_code
code={callbackCode}
redirect_uri={exactSameCallbackUri}
code_verifier={verifierFromCookie}
```

Vor dem Austausch müssen `code`, `state`, gespeicherter `state`, `nonce` und Verifier vorhanden sein.
Der empfangene `state` muss dem Cookie entsprechen.

### 8.4 ID-Token validieren

Das ID-Token wird nicht lediglich dekodiert. Der Server lädt:

```text
https://login.microsoftonline.com/{tenantId}/v2.0/.well-known/openid-configuration
```

Aus den Metadaten werden `issuer` und `jwks_uri` verwendet. `jose.jwtVerify` prüft:

- Signatur gegen das Remote-JWKS;
- Algorithmus ausschließlich `RS256`;
- Issuer exakt aus den Metadaten;
- Audience exakt `ENTRA_CLIENT_ID`;
- Zeitclaims mit 60 Sekunden Clock Tolerance;
- `nonce` gegen den Cookie-Wert.

Der `nonce`-Vergleich erfolgt in konstanter Zeit. Claims dürfen erst nach erfolgreicher Prüfung
verwendet werden. OpenID-Metadaten werden pro Tenant als Promise gecacht; ein fehlgeschlagener
Cache-Eintrag wird entfernt.

### 8.5 Profil und Gruppen

Nach erfolgreicher Token-Prüfung ruft der Server auf:

```http
GET https://graph.microsoft.com/v1.0/me?$select=id,displayName,userPrincipalName,mail,department,onPremisesSamAccountName,onPremisesDomainName,onPremisesUserPrincipalName
Authorization: Bearer <entra-access-token>
```

Die drei `onPremises...`-Felder sind Roadmap-spezifisch: Sie liefern stabile Identitätsvarianten für
SharePoint- und Superadmin-Abgleiche. Eine Zielanwendung kann sie weglassen, sofern ihr
Authorization Provider sie nicht benötigt.

Mindestens eines von `id`, `userPrincipalName` oder `mail` muss vorhanden sein.

Anschließend wird best effort und mit Pagination aufgerufen:

```http
GET https://graph.microsoft.com/v1.0/me/transitiveMemberOf/microsoft.graph.group?$select=displayName&$top=999
```

`@odata.nextLink` wird bis zum Ende verfolgt. Bei Fehlern wird der Login fortgesetzt. Sind keine
Graph-Gruppennamen verfügbar und enthält das validierte ID-Token ein Array `groups`, wird dieses
verwendet. Bei Entra Group Overage ist dieser einfache Claim-Fallback nicht ausreichend; für
verlässliche Rollen muss die Zielanwendung Graph oder eine eigene Rollendatenbank verwenden.

### 8.6 Eigene Session ausstellen

Nach erfolgreicher Identitätsprüfung:

1. `username = userPrincipalName || mail || 'unknown'`
2. `displayName = displayName || username`
3. Department bevorzugt aus Graph `/me`, ersatzweise aus der validierten ID-Token-Claim
4. App-JWT mit kanonischer TTL signieren
5. App-JWT und dieselbe TTL im `HttpOnly`-Cookie verwenden
6. temporäre Cookies löschen

Das Callback setzt zwingend `isAdmin: false`. Eine Zielanwendung soll diesen Claim vorzugsweise
ganz weglassen; sie darf ihn nicht auf Basis des erfolgreichen Logins auf `true` setzen.

## 9. Popup- und Redirect-Modus

### Redirect

Nach Setzen des Cookies antwortet der Callback mit HTTP 302 auf die validierte `returnUrl`. Dadurch
findet ein vollständiger Seitenaufruf mit dem neuen Cookie statt.

### Popup

Der Callback liefert eine kleine HTML-Seite. Sie sendet an `window.opener` derselben Origin nur:

```ts
{ type: 'AUTH_SUCCESS', username?: string }
// oder
{ type: 'AUTH_ERROR', error?: string }
```

Das Session-JWT wird nie in `postMessage`, URL, Fragment oder JavaScript-State übertragen. Das
Hauptfenster akzeptiert Nachrichten nur, wenn `event.origin === window.location.origin` gilt. Nach
der Erfolgsmeldung prüft das Hauptfenster die Session erneut serverseitig.

## 10. Session-Verifikation und CSRF

`extractAdminSession()` akzeptiert:

1. `Authorization: Bearer <app-jwt>`; dieser Wert hat Vorrang;
2. andernfalls das Cookie `roadmap-admin-token`.

Das Token wird mit `JWT_SECRET`, festem Algorithmus, Issuer, Audience und Ablaufzeit verifiziert.
Danach muss seine `jti` in `AuthSession` existieren, nicht widerrufen und noch nicht abgelaufen sein.
Ein Datenbankfehler verweigert den Zugriff.

Für Cookie-Sessions gilt bei `POST`, `PUT`, `PATCH`, `DELETE` und anderen unsicheren Methoden:

- Ein `Origin`-Header muss vorhanden sein.
- Seine Origin muss exakt einer vorkonfigurierten `APP_ORIGIN` beziehungsweise der Origin der
  festen `ENTRA_REDIRECT_URI` entsprechen.
- Safe Methods `GET`, `HEAD`, `OPTIONS` benötigen diese Prüfung nicht.
- Ein Bearer-Request nutzt nicht die Cookie-CSRF-Grenze, weil der Browser den Bearer nicht
  automatisch mitsendet.

`Host`, `X-Forwarded-Host` und `X-Forwarded-Proto` dürfen weder CSRF-Entscheidungen noch interne
Ziel-URLs oder OIDC-Redirects bestimmen.

Serverinterne Aufrufer können `extractAdminSessionFromHeaders()` verwenden. Diese Variante führt
keine Origin-Prüfung aus und darf nicht unkritisch als öffentlicher Request-Guard verwendet werden.

## 11. Authentifizierung ist nicht Autorisierung

Dies ist die wichtigste app-übergreifende Designregel.

### 11.1 Drei unterschiedliche Guards

| Guard                                   | Bedeutung                                      | Verwendung                                |
| --------------------------------------- | ---------------------------------------------- | ----------------------------------------- |
| `requireUserSession(req)`               | gültig angemeldete Identität                   | Ausgangspunkt für fachliche Rechteprüfung |
| `isAdminSessionAllowedForInstance(...)` | aktuelle Adminrechte für eine konkrete Instanz | schreibende Instanz-APIs                  |
| `requireSuperAdminAccess(req)`          | aktuelle globale Superadminrechte              | globale Verwaltungs-APIs                  |

`requireAdminSession(req)` verlangt dagegen den statischen JWT-Claim `isAdmin === true`. Da der
Entra-Callback absichtlich `isAdmin: false` setzt, ist dieser Guard für die aktuelle dynamische
Rechtearchitektur ungeeignet und kann bei tatsächlich berechtigten Personen zu 401 führen.

### 11.2 Aktuelle Roadmap-Rechteregeln

Superadmin wird in dieser Reihenfolge ermittelt:

1. aktiver Treffer in der lokalen Tabelle `SuperAdmin` gegen exakt normalisierte stabile Werte:
   `tenantId:objectId`, vollständige UPN/Mail oder `DOMAIN\\account`;
2. andernfalls Live-Prüfung der SharePoint-Gruppe `superadmin` über konfigurierte Instanzen.

Instanz-Admin wird aus folgenden Quellen ermittelt:

1. bereits bestätigter Superadmin;
2. explizite Benutzerfreigabe in `instance.metadata.adminAccess.allowedUsers`;
3. für Lesezugriff: Token-Gruppen und implizite Gruppe `admin-<instanceSlug>` als Hinweis;
4. für Lesezugriff: Department-Zuordnung in `InstanceDepartmentAccess`;
5. Live-Prüfung der SharePoint-Gruppen `admin-<instanceSlug>` und `superadmin`.

Für Admin-Schreibrechte werden potenziell veraltete Token-Gruppen nicht allein akzeptiert; die
Mitgliedschaft wird live beziehungsweise über explizite Konfiguration bestätigt.

Eine andere Anwendung muss diese SharePoint- und Instanzregeln nicht kopieren. Sie muss aber eine
eigene serverseitige `AuthorizationProvider`-Schicht einsetzen, statt Login-Erfolg mit Rolle
gleichzusetzen.

Beispielschnittstelle:

```ts
interface AuthorizationProvider {
  canRead(session: AppSession, resource: Resource): Promise<boolean>;
  canAdminister(session: AppSession, resource: Resource): Promise<boolean>;
  isSuperAdmin(session: AppSession): Promise<boolean>;
}
```

## 12. Frontend-Vertrag

Der Browser ruft `/api/auth/check-admin-session` mit `credentials: 'same-origin'` auf und cached die
Antwort nur 1,5 Sekunden. Anzeigeinformationen wie der Benutzername dürfen in `sessionStorage`
liegen; das Token selbst nicht.

- `hasValidUserSession()` prüft `authenticated`.
- `hasValidAdminSession()` prüft den serverseitig berechneten Wert `isAdmin`.
- `hasValidSuperAdminSession()` prüft `isSuperAdmin`.
- `withAdminAuth` und `withSuperAdminAuth` steuern Redirects und Fehlermeldungen.

Diese Client-Guards sind keine Sicherheitsgrenze. Direkte HTTP-Aufrufe müssen von der API weiterhin
abgewiesen werden.

## 13. Logout

`POST /api/auth/entra/logout` mit passendem Same-Origin-Header:

1. markiert die aktuelle `jti` in `AuthSession` als widerrufen; bei Datenbankfehler wird abgebrochen;
2. löscht danach `roadmap-admin-token` mit identischen Cookie-Attributen und `Max-Age=0`;
3. setzt `Cache-Control: no-store`;
4. leitet zum tenant-spezifischen Entra-Endpunkt
   `/{tenant}/oauth2/v2.0/logout?post_logout_redirect_uri=...`.

Ohne `ENTRA_POST_LOGOUT_REDIRECT_URI` wird die Origin aus `ENTRA_REDIRECT_URI` plus Base Path und
`/admin/login` verwendet. Deshalb sollte mindestens eine der beiden absoluten URLs immer gesetzt
sein.

Logout macht auch eine zuvor kopierte Tokenkopie beim nächsten Request unbrauchbar. Es existieren
keine Refresh Tokens; nach Ablauf ist ein neuer Entra-Login erforderlich.

## 14. Reverse Proxy und Base Path

Die öffentliche Origin stammt ausschließlich aus `APP_ORIGIN` und der expliziten
`ENTRA_REDIRECT_URI`. Der Base Path stammt abhängig von `NEXT_PUBLIC_DEPLOYMENT_ENV` aus
`NEXT_PUBLIC_BASE_PATH_PROD` oder `NEXT_PUBLIC_BASE_PATH_DEV`. Produktion startet ohne feste
Redirect-URI nicht.

Beispiel:

```text
APP_ORIGIN=https://example.org
ENTRA_REDIRECT_URI=https://example.org/roadmap/api/auth/entra/callback
NEXT_PUBLIC_BASE_PATH_PROD=/roadmap

=> https://example.org/roadmap/api/auth/entra/callback
```

Der Proxy muss den Base Path konsistent an Next.js routen. Eine falsche Origin oder ein fehlender
Base Path verursacht typischerweise Entra `redirect_uri_mismatch`, falsche `Secure`-Entscheidungen
oder abgewiesene CSRF-Origin-Prüfungen.

## 15. Portierungsreihenfolge

Eine implementierende KI soll in dieser Reihenfolge arbeiten:

1. Framework, Routing-Modell, öffentliche Origin, Proxy und Base Path des Zielsystems erfassen.
2. Entra App Registration und exakte Redirect-/Logout-URIs definieren.
3. Secret-Konfiguration und kanonische Session-TTL implementieren.
4. PKCE-, OIDC-Metadata-, JWKS-, Token- und Graph-Schicht implementieren.
5. Cookie- und lokale Return-URL-Helfer implementieren und isoliert testen.
6. Status- und Login-Route implementieren.
7. Callback mit vollständiger Validierungsreihenfolge und Cookie-Cleanup implementieren.
8. Eigenes Sessionformat definieren; keine externe Rolle ungeprüft übernehmen.
9. Session-Extractor plus CSRF-Origin-Prüfung implementieren.
10. Zielanwendungs-spezifischen Authorization Provider implementieren.
11. Geschützte APIs serverseitig mit Identitäts- und Rechteguard versehen.
12. Popup/Redirect-UI, Sessionstatus und Logout ergänzen.
13. Negativtests und einen echten Entra-Smoke-Test durchführen.

## 16. Dateimatrix für eine Next.js-Portierung

### Direkt wiederverwendbar oder leicht anpassbar

- [`packages/entra-sso/src/core/pkce.ts`](../packages/entra-sso/src/core/pkce.ts)
- [`packages/entra-sso/src/core/oidc.ts`](../packages/entra-sso/src/core/oidc.ts)
- [`packages/entra-sso/src/core/graph.ts`](../packages/entra-sso/src/core/graph.ts)
- [`packages/entra-sso/src/next/cookies.ts`](../packages/entra-sso/src/next/cookies.ts)
- [`packages/entra-sso/src/next/redirectUri.ts`](../packages/entra-sso/src/next/redirectUri.ts)
- [`utils/sessionSecurity.ts`](../utils/sessionSecurity.ts)

### Als Referenz übernehmen und fachlich anpassen

- [`pages/api/auth/entra/login.ts`](../pages/api/auth/entra/login.ts)
- [`pages/api/auth/entra/callback.ts`](../pages/api/auth/entra/callback.ts)
- [`pages/api/auth/entra/status.ts`](../pages/api/auth/entra/status.ts)
- [`pages/api/auth/entra/logout.ts`](../pages/api/auth/entra/logout.ts)
- [`utils/apiAuth.ts`](../utils/apiAuth.ts)
- [`utils/auth.ts`](../utils/auth.ts)

### Roadmap-spezifisch, nicht blind kopieren

- [`utils/instanceAccessServer.ts`](../utils/instanceAccessServer.ts)
- [`utils/superAdminAccessServer.ts`](../utils/superAdminAccessServer.ts)
- [`utils/instanceDepartmentAccess.ts`](../utils/instanceDepartmentAccess.ts)
- `roadmapInstance` Query-/Cookie-Kontext
- Prisma-Modelle `SuperAdmin`, `RoadmapInstance` und `InstanceDepartmentAccess`

## 17. Verbindliche Testmatrix

### Unit Tests

- Zufallswerte sind Base64URL und zwei Aufrufe unterscheiden sich.
- PKCE Challenge entspricht `base64url(SHA-256(verifier))`.
- Fehlendes, kurzes oder Placeholder-`JWT_SECRET` wird abgelehnt.
- Jede erlaubte TTL wird korrekt in Sekunden umgerechnet; null/negativ/falsches Format scheitert.
- Lokale Return-URLs bewahren Query und Hash.
- Absolute, protokoll-relative, Backslash-, doppelt encodierte und CRLF-URLs werden abgelehnt.
- Cookie-Builder setzt `Path`, `HttpOnly`, `SameSite`, `Secure` und `Max-Age` korrekt.
- Unsichere Cookie-Requests ohne oder mit fremder Origin werden abgelehnt.

### Callback-Integrationstests

- gültiger Code + state + nonce + PKCE führt zu App-Cookie und Redirect;
- falscher `state` scheitert vor Token-Austausch;
- fehlender Verifier scheitert;
- falsche `nonce` scheitert;
- falscher Issuer, Audience, Algorithmus, Signatur oder abgelaufenes ID-Token scheitert;
- fehlendes Graph-`/me`-Profil scheitert;
- Gruppen-Endpoint darf scheitern, ohne den Login zu verhindern;
- jeder Erfolgs- und Fehlerpfad löscht Transaktionscookies;
- Popup-Erfolg überträgt kein Token;
- unsichere `returnUrl` endet am Fallback.

### Autorisierungs- und API-Tests

- gültige Identität ohne Rolle erhält keinen Adminzugriff;
- berechtigter Benutzer wird über den aktuellen Authorization Provider zugelassen;
- Rollenentzug wirkt ohne Neuanmeldung beim nächsten Rechtecheck;
- normale Admins erreichen keine Superadmin-API;
- Client-Guard-Umgehung ändert das API-Ergebnis nicht;
- Cookie-POST mit fremder oder fehlender Origin scheitert;
- Bearer- und Cookie-Priorität ist eindeutig getestet.

### Deployment-Smoke-Test

1. Statusroute meldet `enabled: true`; die exakte Callback-URI wird separat aus der
   Deployment-Konfiguration geprüft, weil die öffentliche Statusroute sie absichtlich nicht
   ausgibt.
2. Login startet auf dem korrekten Tenant.
3. Callback setzt ein `HttpOnly`, `Secure`, `SameSite=Lax` App-Cookie.
4. Im Browser, in Redirect-URLs und Logs erscheint kein Entra- oder App-Token.
5. Sessionstatus liefert Identität, aber nur fachlich berechnete Rollen.
6. Lokaler und zentraler Logout löschen das App-Cookie.

## 18. Typische Fehler und Diagnose

| Symptom                                | Wahrscheinliche Ursache                                               | Prüfung                                                           |
| -------------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `redirect_uri_mismatch`                | Callback-URI oder Base Path weicht ab                                 | `ENTRA_REDIRECT_URI`/Base Path und Entra Registration vergleichen |
| Login funktioniert, API gibt 401       | API nutzt statischen `isAdmin`-Claim statt Identität plus Fachprüfung | `requireUserSession` und Authorization Provider einsetzen         |
| Berechtigter Benutzer erhält 403       | DB-/Gruppen-/Instanzprüfung schlägt fehl                              | `whoami`, Rollenquelle und Backend-Verbindung prüfen              |
| Cookie wird lokal nicht gesetzt        | `Secure` bei lokalem HTTP                                             | `NODE_ENV` und lokales Protokoll prüfen                           |
| POST gibt 401 trotz gültigem Cookie    | `Origin` fehlt oder passt nicht zu `APP_ORIGIN`/Redirect-Origin       | feste Origins und Browser-`Origin` prüfen                         |
| Graph-Gruppen fehlen                   | `GroupMember.Read.All`/Admin Consent fehlt                            | Graph-Fehlerlog; Login muss trotzdem funktionieren                |
| Superadmin-Fallback langsam/fehlerhaft | SharePoint-Gruppenabfrage über mehrere Instanzen                      | lokalen DB-Superadmin und Scope-Konfiguration prüfen              |
| Logout gibt 500                        | weder gültige Post-Logout- noch Redirect-URI                          | absolute Logout-URI setzen                                        |

## 19. Bekannte Grenzen des aktuellen Designs

- Keine Refresh-Token-Verwendung: Nach Ablauf der App-Session ist ein neuer Login erforderlich.
- Die Sessiontabelle ist eine harte Verfügbarkeitsabhängigkeit: Ist die Datenbank nicht erreichbar,
  werden Sessionprüfungen fail-closed abgewiesen.
- Symmetrisches App-JWT: Jeder Dienst mit `JWT_SECRET` kann Sessions ausstellen.
- Die Login-Policy ist offen für jede eindeutig identifizierte Tenant-Person; Fachrechte begrenzen
  erst den Zugriff auf geschützte Funktionen.
- Gruppen werden beim Login aufgenommen und können danach veralten. Schreibrechte dürfen deshalb
  nicht ausschließlich auf diesen Claims beruhen.
- Graph-Gruppen sind Best Effort und Group-Overage wird nicht vollständig über Claims behandelt.
- Der Entra-Logout-Endpunkt ist derzeit tenant-spezifisch fest zusammengesetzt statt aus dem
  `end_session_endpoint` der bereits geladenen OIDC-Metadaten übernommen zu werden.
- Die öffentliche Statusroute meldet absichtlich nur, ob SSO aktiviert ist.
- Die Datei [`utils/auth.ts`](../utils/auth.ts) enthält einen historischen Hash-Token-
  Kompatibilitätsblock. Der aktuelle Callback gibt niemals ein Token im URL-Fragment zurück; eine
  neue Anwendung soll diesen Block nicht übernehmen.

## 20. Abschlusskriterien für eine implementierende KI

Vor der Meldung „fertig“ muss die KI für jeden Punkt konkrete Evidenz nennen:

- exakte Redirect URI und Entra-Konfiguration;
- implementierte Login-, Callback-, Status-, Session- und Logout-Routen;
- kryptografische ID-Token- und `nonce`-Prüfung;
- HttpOnly-Session ohne Token-Leak;
- CSRF-Origin-Prüfung;
- dokumentierter Session-Payload;
- getrennte serverseitige Autorisierungsquelle;
- positive und negative Tests aus Abschnitt 17;
- erfolgreicher Build und, sofern Zugang vorhanden, echter Entra-Smoke-Test;
- dokumentierte Abweichungen vom Roadmap-Modell mit Begründung.

Ohne diese Nachweise ist die Portierung nicht als vollständig zu betrachten.
