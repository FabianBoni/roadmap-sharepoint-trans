# AI Endpoint Heartbeat – Portierungsanleitung

Diese Komponente überwacht einen oder mehrere AI-Dienste serverseitig. Sobald mindestens ein
konfigurierter Dienst nicht innerhalb des Timeouts antwortet oder einen unerwarteten HTTP-Status
liefert, erscheint oben in der Anwendung ein nicht ausblendbarer Warnhinweis. Nach der nächsten
erfolgreichen Prüfung verschwindet der Hinweis automatisch.

## Architektur

```text
Browser (alle 30 s)
  -> GET /api/health/ai
       -> kurzer In-Memory-Cache (15 s)
       -> parallele GET/HEAD-Probes zu allen AI-Endpunkten
  <- nur Status, Anzeigename und Latenz; keine URL und keine Secrets
```

Der Browser ruft AI-Dienste nie direkt auf. Dadurch bleiben API-Keys serverseitig, CORS spielt
keine Rolle und viele Browser-Tabs werden durch Cache und Single-Flight zu wenigen Upstream-Probes
zusammengefasst.

## Zu portierende Dateien

- `components/AiEndpointHealthBanner.tsx`
- `components/AiEndpointHealthBanner.module.css`
- `pages/api/health/ai.ts`
- `utils/aiHeartbeat.ts`

Bei einer Next.js-App-Router-Anwendung muss lediglich der Pages-API-Handler in einen Route Handler
übertragen werden. Parser und Probe sowie die React-Komponente bleiben gleich.

## Einbau in die Zielanwendung

1. Die vier Dateien übernehmen und gegebenenfalls die Alias-Imports `@/…` anpassen.
2. Den Banner im globalen App- oder Root-Layout vor dem eigentlichen Seiteninhalt rendern:

   ```tsx
   import AiEndpointHealthBanner from '@/components/AiEndpointHealthBanner';

   export default function App({ Component, pageProps }) {
     return (
       <>
         <AiEndpointHealthBanner />
         <Component {...pageProps} />
       </>
     );
   }
   ```

3. Mindestens einen kostenlosen, read-only Health- oder Models-Endpunkt konfigurieren. Keine
   Completion-Anfrage als Heartbeat verwenden: Sie kann Kosten verursachen und benötigt einen
   Request-Body. Die Implementierung erlaubt deshalb absichtlich nur `GET` und `HEAD`.
4. Anwendung neu bauen und starten. `NEXT_PUBLIC_*`-Werte werden bei Next.js während des Builds
   eingebettet.
5. Mit `curl -i http://localhost:3000/api/health/ai` prüfen. Bei Erfolg kommt HTTP 200, bei einem
   Ausfall HTTP 503.

## Konfiguration

`AI_HEARTBEAT_ENDPOINTS` ist ein serverseitiges JSON-Array mit maximal zehn Einträgen:

```dotenv
AI_HEARTBEAT_ENDPOINTS='[
  {
    "id": "primary-ai",
    "label": "Primärer KI-Dienst",
    "url": "https://ai.example.internal/health",
    "method": "GET",
    "timeoutMs": 5000
  },
  {
    "id": "fallback-ai",
    "label": "Fallback-KI",
    "url": "https://fallback.example.internal/v1/models",
    "auth": {
      "header": "Authorization",
      "tokenEnv": "FALLBACK_AI_API_KEY",
      "scheme": "Bearer"
    }
  }
]'
FALLBACK_AI_API_KEY=<secret>
```

Unterstützte Felder:

| Feld               | Pflicht | Bedeutung                                                        |
| ------------------ | ------- | ---------------------------------------------------------------- |
| `id`               | ja      | Eindeutige technische ID, maximal 63 Zeichen                     |
| `label`            | nein    | Anzeigename im Warnbanner; Standard ist `id`                     |
| `url`              | ja      | Server-seitige Health-URL, in Produktion standardmäßig HTTPS     |
| `method`           | nein    | `GET` oder `HEAD`, Standard `GET`                                |
| `timeoutMs`        | nein    | 500–30.000 ms, Standard 5.000 ms                                 |
| `acceptedStatuses` | nein    | Liste erlaubter Statuscodes; Standard ist 200–299                |
| `headers`          | nein    | Statische Header; keine Secrets ins Repository committen         |
| `auth`             | nein    | Secret-Referenz mit `header`, `tokenEnv` und optionalem `scheme` |

Für Header wie `api-key` wird ein leeres Schema verwendet:

```json
{ "auth": { "header": "api-key", "tokenEnv": "AZURE_AI_KEY", "scheme": "" } }
```

Weitere Variablen:

| Variable                                      | Standard          | Bedeutung                                                             |
| --------------------------------------------- | ----------------- | --------------------------------------------------------------------- |
| `AI_HEARTBEAT_REQUIRED`                       | `false`           | Ohne konfigurierte Endpunkte HTTP 503 statt deaktiviert/gesund melden |
| `AI_HEARTBEAT_CACHE_TTL_MS`                   | `15000`           | Cache zwischen Browsern, 1–60 Sekunden                                |
| `AI_HEARTBEAT_ALLOW_HTTP`                     | `false`           | HTTP in Produktion ausdrücklich erlauben, z. B. für ein internes Netz |
| `NEXT_PUBLIC_AI_HEARTBEAT_INTERVAL_MS`        | `30000`           | Prüfintervall im Browser, mindestens 5 Sekunden                       |
| `NEXT_PUBLIC_AI_HEARTBEAT_REQUEST_TIMEOUT_MS` | `12000`           | Timeout des Browser-Aufrufs zum lokalen Health-Endpunkt               |
| `NEXT_PUBLIC_AI_HEARTBEAT_MESSAGE`            | integrierter Text | Benutzerdefinierter Warntext                                          |

## Verhalten und Betrieb

- Ein Timeout, Netzwerkfehler, fehlendes Auth-Secret oder unerwarteter HTTP-Status setzt den
  Gesamtstatus auf `ok: false` und liefert HTTP 503.
- Der Banner ist nicht schließbar. Er bleibt sichtbar und prüft weiter, bis alle Endpunkte wieder
  erreichbar sind.
- Beim Wechsel zurück in den Browser-Tab und nach einem `online`-Ereignis wird sofort neu geprüft.
- Redirects werden nicht verfolgt, damit Auth-Header nicht an ein anderes Ziel weitergegeben
  werden.
- URLs und Tokens werden nicht an den Browser zurückgegeben.

## Abnahmetest

1. Health-URL korrekt konfigurieren: API antwortet 200, kein Banner sichtbar.
2. Host oder Port absichtlich ungültig setzen: API antwortet spätestens nach dem Timeout mit 503,
   Banner bleibt oben sichtbar.
3. Dienst wiederherstellen: Banner verschwindet spätestens nach einem Prüfintervall.
4. Zwei Endpunkte konfigurieren und nur einen abschalten: Gesamtstatus ist 503 und der betroffene
   Anzeigename erscheint im Banner.
5. Im Browser-Netzwerk-Tab bestätigen, dass keine AI-URL und kein API-Key ausgeliefert werden.
