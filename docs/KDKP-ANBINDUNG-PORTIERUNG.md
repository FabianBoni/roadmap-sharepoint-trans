# KDKP-Anbindung und Portierungsleitfaden

Stand: 29. Juli 2026

## Zweck und Geltungsbereich

Dieses Dokument beschreibt die im Projekt **SchubanAi** implementierte Anbindung an
die KI-Plattform KDKP. Es dient als technische Grundlage, um die Anwendung auf
eine andere Laufzeitumgebung, einen anderen KDKP-Mandanten oder eine andere
OpenAI-kompatible KI-Plattform zu portieren.

Die Beschreibung basiert auf dem aktuellen Quellcode. Konkrete Zugangsdaten und
interne Endpunktadressen gehören nicht in dieses Dokument, sondern in die
Secret-Verwaltung der jeweiligen Zielumgebung.

## Kurzüberblick

KDKP wird ausschliesslich durch das Python-Backend angesprochen. Der Browser
erhält zu keinem Zeitpunkt den KDKP-API-Schlüssel.

Es gibt zwei getrennte KDKP-Schnittstellen:

1. **Textgenerierung/Chat**
   - OpenAI-kompatible Chat-Completions-API
   - Zugriff über `langchain_openai.ChatOpenAI`
   - unterstützt im aktuellen Ablauf Tool Calls für die Abfrage der ChromaDB
2. **Embeddings**
   - OpenAI-kompatible Embeddings-API
   - Zugriff über `chromadb.utils.embedding_functions.OpenAIEmbeddingFunction`
   - erzeugt Vektoren beim Import und bei der Suche in der ChromaDB

```text
Browser
  |
  | HTTPS / Next.js API
  v
Next.js (Authentisierung, Validierung, Rate Limit, Dokumentextraktion)
  |
  | internes HTTP
  v
Flask API
  |                         |
  | Chat Completions        | Embeddings
  v                         v
KDKP Text-API             KDKP Embedding-API
  ^                         |
  | Tool-Ergebnis           v
  +---------------------- ChromaDB
                           (lokal persistent)
```

## Relevante Implementierungsdateien

| Datei                           | Aufgabe                                                                                       |
| ------------------------------- | --------------------------------------------------------------------------------------------- |
| `api/index.py`                  | Flask-Routen, KDKP-Chat-Client, Embedding-Client, Retry-Logik, Prompts und Dokument-Ingestion |
| `api/tools.py`                  | LangChain-Werkzeug `query_chromadb` und ChromaDB-Zugriff während Tool Calls                   |
| `app/api/chat/route.ts`         | Authentisierter, nicht streamender Chat-Endpunkt des Frontends                                |
| `app/api/chat/stream/route.ts`  | Authentisierter Chat-Endpunkt mit nachgelagert simuliertem Streaming                          |
| `app/api/chat/utils.ts`         | Payload-Validierung, Rate Limit, Retry und Verbindung zur Flask API                           |
| `app/api/chat/extract/route.ts` | Extraktion von PDF-, DOCX-, TXT- und Markdown-Dateien sowie Ingestion                         |
| `app/components/details.tsx`    | Aufruf der KI-gestützten Schutzbedarfsanalyse                                                 |
| `ecosystem.config.cjs`          | Betrieb von Next.js und Flask mit PM2                                                         |
| `.github/workflows/deploy.yml`  | Übernahme der KDKP-Konfiguration aus GitHub Secrets                                           |
| `requirements.txt`              | Python-Abhängigkeiten für LangChain, OpenAI, ChromaDB, HTTP und TLS                           |

## Konfiguration

### Erforderliche Variablen

| Variable               | Bedeutung                                                                                      |
| ---------------------- | ---------------------------------------------------------------------------------------------- |
| `KDKP_TEXT_URL`        | OpenAI-kompatible Basis-URL für Textgenerierung; soll auf die API-Basis inklusive `/v1` zeigen |
| `KDKP_TEXT_MODEL`      | KDKP-Modellbezeichnung für Chat/Textgenerierung                                                |
| `KDKP_EMBEDDING_URL`   | OpenAI-kompatible API-Basis für Embeddings                                                     |
| `KDKP_EMBEDDING_MODEL` | KDKP-Modellbezeichnung für Embeddings                                                          |
| `KDKP_API_KEY`         | API-Schlüssel mit Berechtigung für beide Routen und Modelle                                    |

Beispiel ohne echte Werte:

```dotenv
KDKP_TEXT_URL="https://<kdkp-host>/<text-service>/v1"
KDKP_TEXT_MODEL="<text-model>"
KDKP_EMBEDDING_URL="https://<kdkp-host>/<embedding-service>/v1"
KDKP_EMBEDDING_MODEL="<embedding-model>"
KDKP_API_KEY="<secret>"
```

Der Text-Endpunkt wird normalisiert. Ein irrtümlich konfigurierter Pfad wie
`.../v1/chat/completions` wird auf die von `ChatOpenAI` erwartete Basis-URL
`.../v1` zurückgeführt. Für den Embedding-Endpunkt existiert keine entsprechende
Normalisierung; er muss deshalb direkt im erwarteten Format konfiguriert werden.

### Optionale Variablen

| Variable                       |                Standard | Bedeutung                                                                    |
| ------------------------------ | ----------------------: | ---------------------------------------------------------------------------- |
| `KDKP_TLS_VERIFY`              |                 `false` | Aktiviert die Prüfung des TLS-Zertifikats für den aktuellen Chat-HTTP-Client |
| `KDKP_CHAT_MAX_ATTEMPTS`       |                     `3` | Maximale Anzahl Versuche eines Flask-seitigen LLM-Aufrufs                    |
| `KDKP_CHAT_RETRY_BASE_DELAY_S` |                   `0.7` | Lineare Basiswartezeit zwischen LLM-Versuchen                                |
| `KDKP_CHAT_RETRY_JITTER_S`     |                  `0.35` | Zufälliger Zusatz zur Retry-Wartezeit                                        |
| `CHROMA_UPSERT_BATCH_SIZE`     |                    `64` | Anzahl Dokument-Chunks je ChromaDB-Upsert                                    |
| `NEXT_PUBLIC_PYTHON_API`       | `http://localhost:5328` | Von Next.js verwendete Basis-URL der Flask API                               |

`HTTP_PROXY`, `HTTPS_PROXY` und `NO_PROXY` werden über die Prozessumgebung
berücksichtigt. Der Chat-Client verwendet dazu `httpx.Client(trust_env=True)`.

> **Sicherheitshinweis:** `KDKP_TLS_VERIFY=false` ist nur für eine kontrollierte
> Entwicklungs- oder Übergangsumgebung vertretbar. In der Zielumgebung sollte die
> Zertifikatskette installiert und `KDKP_TLS_VERIFY=true` gesetzt werden.

### Laden und Lebensdauer der Konfiguration

- Lokal kann `api/index.py` Werte aus `api/.env.local` laden.
- Beim Produktions-Deployment schreibt der GitHub-Workflow die Secrets in die
  nicht versionierte Datei `.env`.
- Flask wird über `python -m flask` gestartet und lädt mit `python-dotenv` die
  Umgebungsdatei aus dem Projektverzeichnis.
- Next.js verwendet dieselbe `.env` für seine serverseitige Konfiguration.
- LLM- und Embedding-Objekte werden beim ersten Gebrauch erzeugt und danach im
  Prozess zwischengespeichert. Änderungen an URL, Modell oder Schlüssel erfordern
  daher einen Neustart der Flask-Prozesse.

Die Dateien `.env*` sind durch `.gitignore` ausgeschlossen. Geheimnisse dürfen
nicht in Git, Build-Artefakten, Logs oder diese Dokumentation übernommen werden.

## Authentisierung und Protokoll

Beide KDKP-Aufrufe verwenden das OpenAI-kompatible Protokoll. Die eingesetzten
Bibliotheken übertragen `KDKP_API_KEY` als API-Zugangsdaten. Der Text-Client
behandelt den Wert als Secret und loggt ihn nicht.

Die Portierung setzt deshalb Folgendes voraus:

- Der Zielendpunkt akzeptiert die von den OpenAI-Clients verwendete
  Authentisierung.
- Der Schlüssel ist für Text- und Embedding-Modell freigeschaltet.
- Das Textmodell unterstützt Chat Completions und, für den RAG-Ablauf, Function
  beziehungsweise Tool Calling.
- DNS, Proxy, Firewall und TLS-Vertrauenskette erlauben aus dem Flask-Prozess
  ausgehende HTTPS-Verbindungen zum Ziel.

Falls die Zielplattform andere Header, getrennte API-Schlüssel oder ein anderes
Payload-Format erwartet, muss eine Adapter-Schicht in `api/index.py` und
`api/tools.py` eingeführt werden.

## Datenflüsse

### 1. Schutzbedarfsanalyse

```text
Detailsansicht
  -> POST /api/schuban
  -> Flask erzeugt System- und User-Prompt
  -> KDKP Text-API
  -> optionaler Tool Call query_chromadb
  -> KDKP Text-API mit Tool-Ergebnis
  -> erwartetes rohes JSON mit GS/ES/SHS und Begründungen
```

Die Route erwartet vom Modell ein JSON-Objekt für:

- `grcConfidentiality`
- `grcIntegrity`
- `extAccountability`
- `grcAvailability`
- jeweils ein zusätzliches Feld mit dem Suffix `Reason`

Die Bewertung verwendet die Werte `GS`, `ES` oder `SHS`. Die aufrufende
React-Komponente validiert und normalisiert die Modellantwort. Eine Portierung
darf das Antwortformat daher nicht unbeabsichtigt verändern.

Wenn das Modell `query_chromadb` aufruft, wird das Tool ausgeführt und dessen
Ergebnis erneut an das Modell gesendet. Der Prompt fordert höchstens einen Tool
Call; der Code selbst enthält in dieser Route jedoch keine separate harte
Rundengrenze.

### 2. Dashboard-Chat

```text
Dashboard
  -> POST /api/chat/stream, bei Fehler Fallback auf /api/chat
  -> NextAuth-Session prüfen
  -> In-Memory-Rate-Limit prüfen
  -> Nutzereingaben und Kontext begrenzen
  -> Flask POST /api/chat
  -> KDKP Text-API
  -> optional bis zu drei Tool-Call-Runden mit ChromaDB
  -> Antwort an Next.js
  -> wortweises Streaming an den Browser
```

Wichtig: Die aktuelle Streaming-Route wartet zuerst auf die vollständige
KDKP-Antwort und gibt sie anschliessend wortweise aus. Es handelt sich nicht um
ein natives Streaming der KDKP-Verbindung.

Begrenzungen des übertragenen Kontexts:

- Next.js akzeptiert maximal 20 Chatnachrichten mit je 8'000 Zeichen.
- Flask verwendet davon die letzten 12 gültigen User-/Assistant-Nachrichten.
- Es werden maximal acht ausgewählte Dokumente mit je 20'000 Zeichen angenommen.
- Für den direkten Dokumentkontext verwendet Flask maximal 6'000 Zeichen pro
  Dokument und 24'000 Zeichen insgesamt.
- Next.js akzeptiert maximal 200 Dashboard-Objekte; Flask verwendet maximal 160.
- Der Systemprompt und der sichtbare Dashboard-Kontext werden ebenfalls an KDKP
  gesendet.

### 3. Dokument-Ingestion und RAG

```text
Datei-Upload
  -> Next.js extrahiert Text
  -> POST /api/ingest-documents
  -> Normalisierung und Aufteilung in Chunks
  -> KDKP Embedding-API
  -> persistente ChromaDB
  -> query_chromadb erzeugt Such-Embedding über KDKP
  -> relevante Chunks gehen als Tool-Ergebnis an das Textmodell
```

Unterstützte Uploadformate sind PDF, DOCX, TXT und Markdown. Next.js begrenzt den
extrahierten Text auf 20'000 Zeichen je Datei. Flask teilt ihn in Chunks von
1'200 Zeichen mit 200 Zeichen Überlappung. Vor der Einbettung werden
Steuerzeichen entfernt und die Chunks derzeit auf ASCII reduziert.

Die ChromaDB liegt relativ zum Arbeitsverzeichnis unter `./chromadb`; die
Collection heisst ebenfalls `chromadb`. Upserts erfolgen stapelweise. Bei einem
Fehler wird bis zu zehnmal mit exponentiellem Backoff wiederholt; danach wird der
Batch rekursiv geteilt, damit einzelne fehlerhafte Chunks übersprungen werden
können.

## Fehlerbehandlung und Retry-Verhalten

Flask wiederholt insbesondere folgende vorübergehende KDKP-Fehler:

- Verbindungs- und Timeoutfehler
- HTTP 429
- HTTP 502, 503 und 504
- Verbindungsabbruch oder vorübergehend nicht verfügbarer Upstream

Standardmässig erfolgen bis zu drei Versuche. Zusätzlich wiederholt die
Next.js-Chat-Schicht den Aufruf der Flask API bis zu dreimal, jeweils mit einem
Timeout von 60 Sekunden. Im Fehlerfall kann ein einzelner Benutzeraufruf dadurch
mehrere KDKP-Aufrufe auslösen.

Typische Fehler:

| Symptom                              | Wahrscheinliche Ursache                                      | Prüfung                                                     |
| ------------------------------------ | ------------------------------------------------------------ | ----------------------------------------------------------- |
| HTTP 404 bei Chat Completions        | `KDKP_TEXT_URL` zeigt auf den falschen Pfad                  | Basis-URL und abschliessendes `/v1` prüfen                  |
| HTTP 403                             | Schlüssel besitzt keine Berechtigung für Route oder Modell   | KDKP-Freigabe für Schlüssel, Benutzer und Modell prüfen     |
| Zertifikatsfehler                    | Interne CA fehlt oder TLS-/Proxy-Konfiguration ist falsch    | CA-Bundle, Truststore, Proxy und TLS-Prüfung kontrollieren  |
| Timeout/502/503/504                  | KDKP oder Netzwerk nicht verfügbar                           | KDKP-Erreichbarkeit, Proxy und PM2-/Flask-Logs prüfen       |
| Embedding-Dimensionsfehler           | Embedding-Modell wurde bei bestehender Collection gewechselt | ChromaDB neu aufbauen und Dokumente neu einbetten           |
| Tool Calls fehlen oder schlagen fehl | Zielmodell unterstützt das OpenAI-Tool-Calling-Schema nicht  | Modellfähigkeit und zurückgegebenes Tool-Call-Format prüfen |
| Leere oder ungültige Analyse         | Modell hält das geforderte JSON-Schema nicht ein             | Prompt, Modell und Antwortvalidierung prüfen                |

Die Flask-Routen geben bei KDKP-Problemen HTTP 502 mit `error` und `details`
zurück. Da `details` Text des Upstreams enthalten kann, sollte die Ausgabe in
einer produktiven Umgebung nicht ungefiltert an nicht privilegierte Benutzer
gelangen.

## Vorgehen bei einer Portierung

### 1. Zielplattform vorbereiten

- KDKP-Text- und Embedding-Endpunkt beschaffen.
- Geeignete Modellnamen festlegen.
- API-Schlüssel mit minimal erforderlichen Rechten ausstellen.
- Tool-Calling-Unterstützung des Textmodells verifizieren.
- DNS, HTTPS, Proxy, Firewall und interne Zertifizierungsstelle einrichten.

### 2. Secrets und Variablen übertragen

- Alle erforderlichen Variablen in der Secret-Verwaltung der Zielumgebung
  anlegen.
- Keine bestehende `.env` kopieren, wenn sie reale Schlüssel enthält.
- `NEXT_PUBLIC_PYTHON_API` auf die intern oder per Reverse Proxy erreichbare
  Flask API setzen.
- `KDKP_TLS_VERIFY=true` verwenden, sobald die CA-Vertrauenskette eingerichtet
  ist.
- Prozesse nach einer Konfigurationsänderung neu starten.

### 3. Anwendungskomponenten übertragen

- Python-Abhängigkeiten aus `requirements.txt` in einer virtuellen Umgebung
  installieren.
- Node-Abhängigkeiten installieren und Next.js bauen.
- Next.js und Flask mit demselben Arbeitsverzeichnis starten, wenn der bisherige
  relative ChromaDB-Pfad beibehalten wird.
- Sicherstellen, dass das Laufzeitkonto Schreibrechte auf `./chromadb` hat.
- Reverse Proxy beziehungsweise Routing für Next.js und die benötigten
  `/api/...`-Pfade konfigurieren.
- Die CORS-Allowlist in `_is_allowed_origin()` an die Zielhosts anpassen, falls
  der Browser die Flask API hostübergreifend aufruft.

### 4. Vektordaten migrieren oder neu erstellen

Eine bestehende ChromaDB darf nur übernommen werden, wenn mindestens folgende
Eigenschaften unverändert bleiben:

- Embedding-Modell und Vektordimension
- Embedding-Vorverarbeitung
- ChromaDB-Version beziehungsweise kompatibles Speicherformat
- Collection-Name

Bei einem Wechsel des Embedding-Modells ist die bestehende Collection nicht
weiterzuverwenden. Die Referenzdokumente müssen in der Zielumgebung vollständig
neu importiert und über das neue Modell eingebettet werden.

### 5. Funktional prüfen

Die bestehende Health-Route prüft nur, ob Flask läuft:

```bash
curl -fsS http://127.0.0.1:5328/api/python
```

Sie prüft KDKP nicht. Für einen echten Smoke Test sind alle drei Abläufe zu
testen:

1. Ein kleines Dokument importieren und den erfolgreichen ChromaDB-Upsert
   kontrollieren.
2. Eine Chatfrage senden, die ohne und eine, die mit `query_chromadb` beantwortet
   wird.
3. Eine Schutzbedarfsanalyse auslösen und das vollständige JSON-Schema prüfen.

Beispiel für den Chat über die lokale Flask API:

```bash
curl -fsS \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Antworte nur mit: KDKP erreichbar"}]}' \
  http://127.0.0.1:5328/api/chat
```

Beispiel für einen Embedding-/Ingestion-Smoke-Test:

```bash
curl -fsS \
  -H "Content-Type: application/json" \
  -d '{"documents":[{"name":"smoke-test.txt","mimeType":"text/plain","content":"Technischer KDKP Portierungstest."}]}' \
  http://127.0.0.1:5328/api/ingest-documents
```

Die Tests enthalten absichtlich keinen KDKP-Schlüssel. Er wird ausschliesslich
serverseitig aus der Prozessumgebung gelesen.

## Bekannte Portierungsrisiken im Ist-Zustand

1. **TLS-Prüfung für Embeddings:** Der konfigurierbare `httpx`-Client wird nur an
   `ChatOpenAI` übergeben. Die Embedding-Funktion erhält diesen Client nicht.
   `KDKP_TLS_VERIFY` steuert die TLS-Prüfung der Embedding-Aufrufe daher im
   aktuellen Code nicht zuverlässig. Vor einer Portierung in eine Umgebung mit
   eigener CA sollte dies vereinheitlicht oder durch einen systemweit korrekten
   Truststore gelöst werden.
2. **Doppelte Embedding-Konfiguration:** `api/index.py` und `api/tools.py`
   erzeugen je eine eigene, lazy geladene Embedding-Funktion. Änderungen müssen
   an beiden Stellen konsistent erfolgen. Sinnvoll wäre ein gemeinsames
   KDKP-/Chroma-Modul.
3. **Ein gemeinsamer API-Schlüssel:** Text- und Embedding-API verwenden dieselbe
   Variable. Falls die Zielplattform getrennte Schlüssel verlangt, müssen zwei
   Variablen und beide Client-Konfigurationen eingeführt werden.
4. **Modellabhängiges Tool Calling:** Die Anwendung bindet
   `query_chromadb` direkt an das Chatmodell. Ein kompatibler Textendpunkt allein
   genügt nicht; das konkrete Modell muss Tool Calls korrekt unterstützen.
5. **Relative ChromaDB-Ablage:** `./chromadb` hängt vom Arbeitsverzeichnis des
   Prozesses ab. Bei Containerisierung oder einem anderen Prozessmanager sollte
   ein expliziter, persistenter Pfad konfiguriert werden.
6. **In-Memory-Rate-Limit:** Das Chat-Rate-Limit von zehn Anfragen pro Minute und
   Benutzer/IP lebt nur im Next.js-Prozess. Es ist bei mehreren Instanzen nicht
   global konsistent und geht bei einem Neustart verloren.
7. **Kein natives Streaming:** Die Zielplattform kann Streaming anbieten, die
   Anwendung nutzt es derzeit aber nicht. Lange Antworten unterliegen deshalb
   weiterhin dem vollständigen 60-Sekunden-Upstream-Timeout.
8. **Keine KDKP-Health-Prüfung:** Der Deployment-Workflow prüft Next.js und die
   Flask-Health-Route, aber weder Text- noch Embedding-Endpunkt.
9. **CORS-Allowlist im Code:** Zulässige Origins sind fest in `api/index.py`
   hinterlegt und müssen bei neuen Hostnamen angepasst werden.
10. **Upstream-Details in Fehlerantworten:** Technische KDKP-Fehler werden
    teilweise bis zum Client weitergereicht. Für den produktiven Betrieb sollte
    zwischen internem Logging und externer Fehlermeldung getrennt werden.

## Abnahmekriterien

Die Portierung ist abgeschlossen, wenn:

- Next.js und Flask in der Zielumgebung stabil gestartet werden;
- beide KDKP-Endpunkte mit aktivierter TLS-Prüfung erreichbar sind;
- keine API-Schlüssel im Browser, Repository oder Anwendungslog erscheinen;
- Chat und Schutzbedarfsanalyse gültige Antworten liefern;
- Tool Calls gegen ChromaDB funktionieren;
- Dokumente eingebettet und wiedergefunden werden;
- nach einem Modellwechsel alle Dokumente neu indiziert wurden;
- 401, 403, 404, 429, Timeout und 5xx kontrolliert behandelt werden;
- Zielhosts, Reverse Proxy, CORS und persistente Datenträger dokumentiert und
  getestet sind.
