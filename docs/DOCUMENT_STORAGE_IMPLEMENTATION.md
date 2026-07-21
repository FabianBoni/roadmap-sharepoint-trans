# Dokumentenspeicherung in der Roadmap

Stand: 17. Juli 2026

## Ergebnis

Roadmap-Dokumente werden als Dateien in der SharePoint-Dokumentbibliothek
`Roadmap Documents` gespeichert. Eine Datei gehört genau zu der Roadmap-Instanz, deren
SharePoint-Site für den Request aufgelöst wurde, und liegt dort im Ordner der unveränderlichen
SharePoint-Projekt-ID:

```text
Roadmap Documents/<projectId>/<documentId>__<originalFileName>
```

Vor Listing, Upload, Download und Löschen prüft die API, dass das Projekt in dieser Instanz
existiert. Freie SharePoint-Pfade werden vom Client nicht akzeptiert.

## Berechtigungen

| Operation          | Roadmap-Prüfung                                                 |
| ------------------ | --------------------------------------------------------------- |
| Liste und Download | gültige Entra-/Roadmap-Session und Lesezugriff auf die Instanz  |
| Upload und Löschen | gültige Entra-/Roadmap-Session und Adminzugriff auf die Instanz |

Kerberos/SPNEGO beziehungsweise der optionale NTLM-Fallback authentifizieren nur den technischen
Service-Account zwischen Roadmap-Server und SharePoint. Sie ersetzen die Benutzer- und
Projektprüfung der Roadmap nicht. `UploadedByOid` und `UploadedByName` stammen daher aus der
Entra-Session und werden – sofern die Felder provisioniert sind – als SharePoint-Metadaten
gespeichert.

## Dokumentidentität und Kompatibilität

Neue Dokumente erhalten eine UUID. Damit überschreibt ein gleichnamiger Upload keine bestehende
Datei. API, Download und Löschen verwenden `DocumentId`; die Oberfläche zeigt weiterhin
`FileName` an. Bestehende Dateien im alten Format `<projectId>/<fileName>` bleiben sichtbar und
adressierbar. Ihr vorhandener Dateiname dient beim Listing als Legacy-Dokument-ID.

Die API liefert pro Datei:

```json
{
  "DocumentId": "9db7b1b2-0c81-4c26-a9a5-1519d3ac8ed3",
  "FileName": "Projektauftrag.pdf",
  "ServerRelativeUrl": "/sites/roadmap/Roadmap Documents/42/..."
}
```

## Upload

- Kleine Dateien bis 256 KB werden direkt hochgeladen.
- Größere Dateien werden in 512-KB-Blöcken über SharePoints `StartUpload`, `ContinueUpload` und
  `FinishUpload` übertragen.
- Der Attachment-Endpunkt und der SharePoint-Proxy verarbeiten Binärdaten unverändert als Raw
  Body.
- Dateigröße, Dateiname, Endung und die Signatur des ersten Dateiblocks werden serverseitig
  geprüft.
- Erlaubt sind PDF, Word, Excel, PowerPoint, PNG, JPEG, Text, CSV und ZIP.
- Das Standardlimit beträgt 100 MB und kann mit `ROADMAP_DOCUMENT_MAX_BYTES` reduziert werden.
- Einzelne Proxy-Requests sind zusätzlich durch `SP_PROXY_MAX_BODY_BYTES` begrenzt.

Die Signaturprüfung ist keine Malware-Erkennung. Ein Virenscanner beziehungsweise ein
Quarantäne-Workflow muss bei entsprechendem Schutzbedarf zusätzlich auf SharePoint- oder
Infrastrukturebene betrieben werden.

## Download

Downloads werden von SharePoint über den Roadmap-Server gestreamt. Die Datei wird im
Attachment-Endpunkt nicht vollständig in den Arbeitsspeicher geladen. Range-Header werden an
SharePoint weitergereicht, sofern die verwendete SharePoint-Authentifizierungsvariante sie
unterstützt.

Die Antwort setzt `X-Content-Type-Options: nosniff` und `Cache-Control: private, no-store`.
SVG-Dateien werden nicht inline dargestellt. Neue SVG- und HTML-Uploads sind nicht erlaubt.

## SharePoint-Provisionierung

Die Bibliotheksdefinition umfasst:

- `DocumentId`
- `ProjectId`
- `InstanceSlug`
- `OriginalFileName`
- `UploadedAt`
- `UploadedByOid`
- `UploadedByName`

Bei bereits existierenden Instanzen muss die SharePoint-Provisionierung einmal erneut ausgeführt
werden, damit die zusätzlichen Auditfelder angelegt werden. Der Datei-Upload bleibt auch dann
erfolgreich, wenn ein nachgelagertes Metadaten-Update wegen noch nicht provisionierter Felder
fehlschlägt; der Fehler wird serverseitig protokolliert.

## Verifikation

Ausgeführt wurden:

```text
yarn tsc --noEmit
yarn test:security
yarn build
```

Die Prüfungen und der Produktions-Build sind erfolgreich. Ein Live-Upload gegen eine reale
On-Premises-SharePoint-Instanz benötigt eine gültige Entra-Session sowie die Kerberos-/NTLM-
Infrastruktur der Zielumgebung und ist deshalb Teil des Deployment-Smoke-Tests.
