# Security Audit Report

**Projekt:** Roadmap SharePoint Trans  
**Stand:** 22. Juli 2026  
**Scope:** Anwendungscode, API-Routen, Entra SSO, Sessions, Autorisierung, SharePoint-Proxy,
Uploads, Datenbankmigrationen, Abhängigkeiten, CI/CD, Mirror und Git-Historie  
**Methode:** Statischer Code- und History-Audit, gezielte Regressionstests, SQL-Migrationsprüfung,
Dependency-Audit und lokaler Produktionsbuild mit Node.js 22.20.0

## Management Summary

Alle 22 Befunde des Ausgangsaudits wurden im lokalen Codebestand technisch bearbeitet. Zwanzig
Befunde sind vollständig im Repository geschlossen. Bei zwei kritischen Befunden bleiben zwingende
externe Betriebsmaßnahmen offen:

- **CRIT-01:** Historisch offengelegte SharePoint-Zugangsdaten müssen außerhalb dieses
  Repositories rotiert werden. Die alte Git-Historie muss kontrolliert aus allen Remotes, Mirrors,
  Forks, Backups und relevanten Klonen entfernt werden.
- **CRIT-05:** GitHub-Branchschutz, Environment-Reviews und die Ablösung beziehungsweise
  Neuaufsetzung des früher persistenten Runners müssen auf der Plattform bestätigt werden.

Der aktuelle Tree speichert keine instanzbezogenen SharePoint-Benutzernamen oder -Passwörter mehr
in Prisma. Der Mirror veröffentlicht nur noch einen historienfreien Snapshot. Das behebt jedoch
nicht die bereits erfolgte Offenlegung: Ein bekannt gewordenes Geheimnis wird erst durch Rotation
ungültig.

Die Anwendung folgt nach der Härtung einem bewusst einfachen Sicherheitsmodell: **fail closed,
exakte Identitäten, explizite Allowlisten, feste Origins, keine impliziten Proxy-Header als
Vertrauensanker und keine sensitiven Upstream-Details in Clientantworten oder Logs.**

## Statuslegende

- **Behoben:** Code, Konfiguration, Migration und lokale Verifikation sind abgeschlossen.
- **Technisch behoben / Betriebsaktion offen:** Der Repositoryteil ist geschlossen; eine externe,
  potenziell destruktive oder privilegierte Maßnahme kann nicht sicher lokal ausgeführt werden.

## Ergebnisübersicht

| ID      | Risiko                                   | Ergebnis                                                                                                                                                    | Status                                   |
| ------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| CRIT-01 | Zugangsdaten in Git-Historie             | Credential-Felder entfernt, Drop-Migration, DB-Artefakte ausgeschlossen, historienfreier Mirror und Secret-Scan ergänzt; Rotation und History-Rewrite offen | Technisch behoben / Betriebsaktion offen |
| CRIT-02 | Unauthentifizierter SharePoint-Leseproxy | Session für alle Methoden, Instanzrechte und exakte Operations-Allowlist; interne Aufrufe zusätzlich HMAC-signiert                                          | Behoben                                  |
| CRIT-03 | Stored-XSS im Support-Chat               | Nachrichten werden ausschließlich als Text gerendert; Inbox und APIs nur für Superadmins                                                                    | Behoben                                  |
| CRIT-04 | Unscharfe Identitätsvergleiche           | Nur stabile `tenantId:objectId`, volle UPN/E-Mail oder exakte `DOMAIN\\account`-Identitäten                                                                 | Behoben                                  |
| CRIT-05 | Branch-Code mit Secrets/Root-Rechten     | Untrusted Builds auf GitHub-Runner ohne Produktionssecrets; Deploy verweigert root und verlangt Benutzer `roadmap`                                          | Technisch behoben / Betriebsaktion offen |
| HIGH-01 | Stored-XSS über Projektlinks             | Nur `http`, `https` und `mailto`; keine Credentials, relativen URLs oder aktiven Schemes                                                                    | Behoben                                  |
| HIGH-02 | Verwundbares Next.js                     | Next.js 15.5.21, Quill entfernt, Runtime-Audit ohne bekannte Schwachstellen                                                                                 | Behoben                                  |
| HIGH-03 | Abschaltbare TLS-Prüfung                 | Unsichere TLS-Schalter werden abgewiesen; eigene CA statt Prüfungsabschaltung                                                                               | Behoben                                  |
| HIGH-04 | Passwort in Curl-Prozessargumenten       | Curl-Credentials in kurzlebiger Datei mit restriktiven Rechten und garantiertem Cleanup                                                                     | Behoben                                  |
| HIGH-05 | Offene Dienstkonto-/Diagnoseendpunkte    | Session, Instanzrecht oder Superadmin erforderlich; generische Antworten                                                                                    | Behoben                                  |
| MED-01  | Debug-Endpunkt leakt DB-Konfiguration    | In Produktion verboten, expliziter Schalter plus Superadmin; keine DB-Pfade                                                                                 | Behoben                                  |
| MED-02  | OData-Injection/Einstellungszugriff      | OData-Literale escaped; Einstellungs-APIs geschützt; nur kleine Theme-Allowlist öffentlich                                                                  | Behoben                                  |
| MED-03  | API-Schlüssel in Queryparametern         | Nur Header, Mindestlänge, Digest-/Timing-safe-Vergleich, nur GET, generische Fehler                                                                         | Behoben                                  |
| MED-04  | Sensible Daten in Logs                   | Projektwerte, Upstream-Bodies, URLs, Credentials und DB-Pfade entfernt                                                                                      | Behoben                                  |
| MED-05  | Umgehbare lokale Rate Limits             | Persistente DB-Buckets und explizite Liste vertrauenswürdiger Proxyadressen                                                                                 | Behoben                                  |
| MED-06  | Fehlende Browser-Schutzheader            | CSP mit Response-Nonce, HSTS, Frame-/MIME-/Referrer-/Permissions-Policies                                                                                   | Behoben                                  |
| MED-07  | Vertrauen in Host-/Forwarded-Header      | Feste interne Basis-URL und feste Entra-/App-Origins; keine Host-Ableitung                                                                                  | Behoben                                  |
| MED-08  | Nicht widerrufbare Sessions              | Serverseitige `AuthSession` je `jti`, Ablauf/Widerruf bei jedem Request, POST-Logout                                                                        | Behoben                                  |
| MED-09  | Kein Malware-Scan                        | Größen-/Typprüfung plus ClamAV; Scannerfehler und fehlende Konfiguration fail closed                                                                        | Behoben                                  |
| LOW-01  | Logout per GET                           | Ausschließlich POST plus Origin-Prüfung                                                                                                                     | Behoben                                  |
| LOW-02  | Zu detaillierter SSO-Status              | Öffentliche Antwort enthält nur `{ "enabled": boolean }`                                                                                                    | Behoben                                  |
| LOW-03  | Keine Chat-Aufbewahrung                  | 90-Tage-Retention und bereinigende Verarbeitung                                                                                                             | Behoben                                  |

## Technische Umsetzung

### 1. Secrets und Git-Historie

Die Felder `spUsername` und `spPassword` wurden aus
[`prisma/schema.prisma`](../prisma/schema.prisma), Seed und Instanz-APIs entfernt. Die Migration
[`20260722143000_drop_instance_plaintext_credentials`](../prisma/migrations/20260722143000_drop_instance_plaintext_credentials/migration.sql)
kopiert nur die nicht sensitiven Instanzfelder in die neue Tabelle. Frühere Migrationen enthalten
aus Gründen einer reproduzierbaren Migrationskette noch die damaligen **Spaltennamen**, aber keine
hier dokumentierten Geheimwerte.

[`mirror.yml`](../.github/workflows/mirror.yml) erstellt aus `git archive HEAD` einen neuen
Ein-Commit-Snapshot, entfernt Workflows, Datenbankdateien und Environment-Dateien und pusht nur
diesen Snapshot. Ein `git push --mirror` historischer Refs findet nicht mehr statt.

[`security.yml`](../.github/workflows/security.yml) ergänzt Gitleaks über die vollständige Historie
und Dependency Review. Solange bekannte historische Secrets noch vorhanden sind, darf dieser Gate
fehlschlagen; das ist das gewünschte Fail-closed-Verhalten und kein Grund, den Scan zu schwächen.

### 2. SharePoint-Grenze

[`pages/api/sharepoint/[...sp].ts`](../pages/api/sharepoint/%5B...sp%5D.ts) verlangt jetzt bei
Lesezugriffen eine gültige Sitzung und Leserecht auf die konkrete Instanz. Schreibzugriffe verlangen
Instanzadminrechte. Akzeptiert werden nur vollständig beschriebene, benötigte Operationen; ein
erlaubter Listenname öffnet nicht mehr automatisch beliebige Unterressourcen.

Serverinterne Aufrufe verwenden einen eigenen `INTERNAL_API_SECRET`. Die Signatur bindet Zeitstempel,
HTTP-Methode und exaktes Ziel. Der normale Session-Guard bleibt zusätzlich aktiv. Produktionscode
leitet interne Origins weder aus `Host` noch aus `X-Forwarded-*` ab.

Transportseitig werden `NODE_TLS_REJECT_UNAUTHORIZED=0`, `SP_ALLOW_SELF_SIGNED=true` und
`SP_TLS_FALLBACK_INSECURE=true` abgewiesen. Vertrauenswürdige private Zertifikate werden über einen
expliziten CA-Pfad eingebunden. Curl erhält Zugangsdaten nicht mehr über die sichtbare
Prozesskommandozeile, sondern über eine Datei in einem Modus-`0700`-Verzeichnis mit Datei-Modus
`0600`; der Cleanup läuft auch im Fehlerfall.

### 3. Authentifizierung, Sessions und Autorisierung

Das Entra-ID-Token wird tenantgebunden inklusive Signatur, Issuer, Audience, Ablauf und Nonce
validiert. Temporäre SSO-Cookies und das App-Token sind `HttpOnly`, `SameSite=Lax` und in Produktion
`Secure`. OAuth-, Graph- und Datenbankfehler werden nicht in Popup-Nachrichten oder Redirect-URLs
gespiegelt.

App-JWTs verwenden ausschließlich HS256 mit festem Issuer, Audience, `jti`, Sessionversion und
begrenzter Laufzeit. Die neue Migration
[`20260722160000_add_revocable_auth_sessions`](../prisma/migrations/20260722160000_add_revocable_auth_sessions/migration.sql)
führt `AuthSession` ein. Jeder authentifizierte Request verlangt einen existierenden, nicht
widerrufenen und nicht abgelaufenen Datensatz. Datenbankfehler verweigern den Zugriff. Logout
widerruft die konkrete `jti` serverseitig und löscht danach das Cookie.

Globale und instanzbezogene Rechte arbeiten nicht mehr mit Anzeigenamen, Titeln, Mail-Lokalteilen
oder Teilstringvergleichen. Zulässig sind nur:

- `tenantId:objectId`,
- eine vollständige UPN beziehungsweise E-Mail-Adresse,
- ein exaktes `DOMAIN\\account` für On-Premises-Identitäten.

Mehrdeutige Altwerte werden nicht akzeptiert. Der Support-Chat ist aus dem normalen
Admin-Dashboard entfernt; UI und Konversations-APIs verlangen Superadminrechte.

### 4. Eingaben, Ausgaben und Browser

Projektlinks werden zentral validiert. `javascript:`, `data:`, `file:`, eingebettete Credentials,
Protokoll-relative und relative Ziele werden verworfen. Support-Nachrichten werden in der Chat-UI
als `text` gerendert. Bestehender Rich Text läuft weiter durch die serverseitige Allowlist-
Sanitization.

Die CSP verwendet eine pro Response erzeugte Nonce. Seiten mit Nonce sind dynamisch; insbesondere
die Landing-Seite wird nicht mit einer beim Build festgebrannten Nonce statisch ausgeliefert.
Zusätzlich gelten `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
`Permissions-Policy`, `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy` und in Produktion
HSTS.

Upstream-Fehler liefern keine SharePoint-Bodies, internen URLs oder Credentialhinweise an Clients.
Logs enthalten nur operationale Typ-/Statusinformationen. Die öffentliche Settings-Route gibt nur
explizit freigegebene Theme-Werte als kleines DTO zurück.

### 5. Öffentliche API und Rate Limiting

[`pages/api/public/projects.ts`](../pages/api/public/projects.ts) akzeptiert ausschließlich `GET`.
API-Schlüssel werden nur aus `X-API-Key` oder `Authorization: Bearer` gelesen. Konfigurierte Schlüssel
unter 32 Zeichen werden ignoriert; Vergleiche erfolgen über SHA-256-Digests mit timing-sicherer
Gleichheit. Der persistente Limiter speichert nur einen Key-Hash.

Die Migration
[`20260722150000_add_persistent_rate_limits`](../prisma/migrations/20260722150000_add_persistent_rate_limits/migration.sql)
legt `RateLimitBucket` an. Support-Chat und öffentliche API verwenden damit instanzübergreifend
konsistente Limits. Client-IP-Header werden nur berücksichtigt, wenn die direkte Socketadresse in
`TRUSTED_PROXY_ADDRESSES` steht und delegiertes Proxyvertrauen explizit aktiviert ist.

### 6. Uploads

Uploads sind auf 25 MB begrenzt und werden auf erlaubte Dateinamen, Erweiterungen und Magic Bytes
geprüft. Vor der Ablage muss ClamAV den Inhalt als sauber bestätigen. Timeout, Scannerfehler,
fehlende Produktionskonfiguration oder Malware führen zur Ablehnung. Der frühere Chunked-Upload-
Pfad ist deaktiviert, damit kein Teilstrom die vollständige Prüfung umgeht.

### 7. CI/CD und Abhängigkeiten

Untrusted Branches und Pull Requests bauen auf einem GitHub-gehosteten Runner ohne Produktions-
Secrets. Drittanbieter-Actions sind auf unveränderliche Commit-SHAs gepinnt.

Das Produktionsdeployment:

- läuft nur für `main` und im geschützten Environment `production`,
- verweigert UID 0 und jeden Benutzer außer `roadmap`,
- verwendet Node.js 22.20.0 und Yarn 1.22.22,
- schreibt die Laufzeitkonfiguration mit Modus `0600`, ohne Werte auszugeben,
- lehnt unsichere TLS-/Debug-Schalter und Nicht-PostgreSQL-Datenbank-URLs ab,
- führt nur `prisma migrate deploy` aus; kein `db push` und kein `--accept-data-loss`,
- erzwingt TypeScript, Lint, Sicherheitstests, Dependency-Audit und Produktionsbuild vor dem Restart,
- startet ausschließlich den benannten PM2-Prozess mit der gelockten lokalen PM2-Version neu.

Next.js wurde auf 15.5.21 aktualisiert. Der nicht mehr benötigte Quill-Editor und seine transitive
Angriffsfläche wurden entfernt. Das Runtime-Dependency-Audit meldet keine bekannte Schwachstelle.

## Datenbankmigration und Rollout-Auswirkungen

Die verlorene lokale SQLite-Datenbank wird nicht weitergeführt. Die neue PostgreSQL-Datenbank wird
aus der vollständigen Baseline-Migration `20260724130000_postgresql_baseline` aufgebaut.

Vor einem Produktionsrollout sind ein verschlüsseltes Backup und ein getesteter Restore zwingend.
Anschließend wird ausschließlich `yarn prisma migrate deploy` verwendet.

Erwartete Auswirkungen:

- Nach Einführung von `AuthSession` sind bestehende JWTs ohne Sessiondatensatz ungültig; Benutzer
  müssen sich einmal neu anmelden.
- Uploads funktionieren in Produktion nur mit erreichbarem ClamAV.
- `INTERNAL_API_SECRET` ist zusätzlich zu `JWT_SECRET` zwingend und muss unabhängig erzeugt werden.
- Die öffentliche API akzeptiert keine Schlüssel mehr in der URL und keine POST-Weiterleitung.
- Produktionsdaten liegen in PostgreSQL außerhalb des Runner-Checkouts; SQLite-URLs werden vom
  Deployment abgelehnt.
- Unsichere alte TLS- und Debug-Schalter verhindern absichtlich den Start.
- Die nonce-geschützten Pages werden serverseitig pro Request gerendert.

## Verifikation

| Prüfung                                            | Ergebnis                                                                                                  |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `yarn install --frozen-lockfile --non-interactive` | Erfolgreich; Lockfile konsistent                                                                          |
| `yarn tsc --noEmit`                                | Erfolgreich; 0 TypeScript-Fehler                                                                          |
| `yarn lint --max-warnings 100`                     | Erfolgreich; 0 Fehler, 30 nicht blockierende Warnungen                                                    |
| `yarn test:security`                               | **35/35 bestanden**                                                                                       |
| `yarn audit --groups dependencies --level low`     | **0 Schwachstellen, 240 Pakete geprüft**                                                                  |
| `yarn prisma validate`                             | Schema gültig                                                                                             |
| PostgreSQL-Baseline aus Prisma-Schema              | Vollständige PostgreSQL-DDL; keine SQLite-Anweisungen; alle Modelle, Indizes und Fremdschlüssel enthalten |
| ExcelJS-Smoke-Test                                 | Gültiger XLSX-Buffer erzeugt (6.405 Bytes)                                                                |
| `yarn build` mit Node.js 22.20.0                   | Erfolgreicher Next.js-15.5.21-Produktionsbuild                                                            |
| Workflow-YAML                                      | 4/4 Dateien syntaktisch geparst                                                                           |
| `git diff --check`                                 | Keine Whitespace-Fehler                                                                                   |
| Current-tree DB-Scan                               | Keine versionierte `.db`, `.sqlite` oder `.sqlite3` im aktuellen Tree                                     |

Die PostgreSQL-Baseline wurde mit `prisma migrate diff --from-empty` direkt aus dem validierten
aktuellen Schema erzeugt. Der Linux-Deployment-Job bleibt ein zwingender Pre-Deployment-Gate und
darf bei einem Verbindungs- oder Migrationsfehler nicht fortfahren.

Nicht lokal End-to-End geprüft wurden der reale Entra-Tenant, das produktive SharePoint, ClamAV im
Produktionsnetz, der Reverse Proxy und die GitHub-Schutzregeln. Dafür wären reale Infrastruktur und
privilegierte Plattformzugriffe erforderlich.

## Zwingende externe Maßnahmen

### Priorität 0: Secret-Incident abschließen

1. Das historisch betroffene SharePoint-Servicekonto identifizieren, Passwort beziehungsweise
   Schlüssel **sofort rotieren** und aktive Sessions/Tickets widerrufen.
2. SharePoint-, Proxy-, IdP- und Systemlogs ab dem frühesten betroffenen Commit auf Missbrauch
   prüfen. Bei Auffälligkeiten den internen Incident-Response-Prozess starten.
3. Weitere Secrets aus demselben Zeitraum rotieren, falls sie in denselben Datenbanken, Runnern,
   Backups oder Environment-Dateien vorkamen.
4. Keine alten Werte in Tickets, Chat, Bericht oder Konsolenausgaben kopieren.

### Priorität 0: Historie kontrolliert bereinigen

Diese Aktion ändert Commit-IDs und erfordert ein Wartungsfenster, Kommunikationsplan, Backup und
explizite Repository-Owner-Freigabe. Sie wurde deshalb nicht automatisch ausgeführt.

Empfohlenes Verfahren:

1. Alle Schreibzugriffe kurz sperren und sämtliche Remotes, Tags und geschützten Branches erfassen.
2. Einen frischen administrativen Mirror-Klon in einer isolierten Arbeitskopie erstellen.
3. Mit `git filter-repo --path prisma/prisma/dev.db --invert-paths --force` die historische
   Datenbank aus allen Refs entfernen; zusätzliche gefundene Secret-Artefakte im selben Lauf
   aufnehmen.
4. Gitleaks über **alle** bereinigten Refs ausführen.
5. Bereinigte Branches und Tags nach Vier-Augen-Freigabe kontrolliert force-pushen.
6. Mirror, Forks, CI-Caches, Release-Artefakte, Backups und Entwicklerklone separat behandeln;
   alte Klone nicht zurückpushen, sondern neu klonen.
7. Erst nach Rotation und erfolgreichem Full-history-Scan CRIT-01 schließen.

### Priorität 0/1: GitHub und Runner

- Für `main` Pull Request, mindestens eine unabhängige Review, Code-Owner für Security-/Workflow-
  Dateien, Statuschecks und Verbot direkter Pushes erzwingen.
- Environment `production` mit Required Reviewers und ausschließlich `main` als Deployment-Branch
  konfigurieren.
- Secret Scanning und Push Protection aktivieren; Security-Workflow als Required Check setzen.
- Den historischen persistenten Self-hosted Runner als potenziell kontaminiert behandeln: Host neu
  provisionieren oder forensisch freigeben, Runner-Token und dort verwendete Secrets rotieren.
- Den neuen Runner unter dem dedizierten Benutzer `roadmap`, ohne sudo/root und mit minimalen
  Dateirechten betreiben. Netzwerkzugriff nur zu benötigten Zielen erlauben.

## Verbleibende Restrisiken

- Bis Rotation und History-Rewrite abgeschlossen sind, bleibt CRIT-01 praktisch ausnutzbar. Eine
  Codeänderung kann ein bereits bekanntes Passwort nicht wieder geheim machen.
- Kopien in fremden Forks, Caches oder Backups können technisch nicht garantiert gelöscht werden;
  deshalb ist Rotation wichtiger als alleinige Historienbereinigung.
- Gruppenclaims werden beim Login aufgenommen und können während einer Sitzung veralten. Kritische
  Schreibrechte werden deshalb live aus den autoritativen DB-/SharePoint-Regeln aufgelöst; reine
  Anzeigehinweise dürfen trotzdem kurzzeitig alt sein.
- Symmetrische App-JWTs bedeuten: Jeder Dienst mit `JWT_SECRET` könnte Tokens signieren. Das Secret
  muss auf genau den App-Prozess begrenzt und regelmäßig rotiert werden.
- Abhängigkeiten, Browser und Infrastruktur verändern sich. Dependency-Audit, Gitleaks und
  Regressionstests müssen dauerhaft als Pflicht-Gates laufen.

## Abschlussbewertung

Der lokale Codebestand schließt die im Ausgangsaudit dokumentierten Anwendungs- und
Konfigurationslücken mit fail-closed Kontrollen. Ein uneingeschränktes Gesamturteil „sicher“ wäre
trotzdem falsch, solange das offengelegte SharePoint-Geheimnis, die alte Git-Historie und die
externen GitHub-/Runner-Maßnahmen nicht nachweislich bereinigt sind. Der technische Rollout darf
erst nach den Priorität-0-Schritten und einem erfolgreichen Infrastruktur-Smoke-Test erfolgen.
