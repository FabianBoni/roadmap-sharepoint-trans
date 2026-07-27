# Performance architecture

## Measured result

Production builds are the source of truth for browser bundle size.

| Metric | Before | After |
| --- | ---: | ---: |
| `/roadmap` first-load JavaScript | 10.6 MB | 243 kB |
| Independently measured gzip JavaScript | — | 237.6 KiB |

The first-load bundle is approximately 97.7% smaller. `yarn perf:budget` fails when the
route exceeds 300,000 gzip bytes or 1,000,000 raw bytes. Both branch CI and production
deployment run this gate after `next build`.

## Main causes addressed

- Wildcard imports from every `react-icons` package included thousands of unused icons.
  The roadmap now uses a bounded named registry.
- The support chat implementation and its polling loop mounted on every page. The full
  chat is now dynamically imported only when opened and polls only while visible.
- The browser separately requested projects, categories, order, theme settings, and
  authorization state. `/api/roadmap-data` now returns one authorized snapshot.
- Authorization fallbacks could iterate every configured SharePoint instance. Global
  roles now use the database; SharePoint group fallback is limited to the active instance.
- Repeated SharePoint reads had no shared request or snapshot cache. Roadmap, access,
  settings, list-schema, and mirroring reads now use short-lived caches with in-flight
  request coalescing and write-side invalidation.
- SharePoint collection reads stopped at one page. OData next links are now followed with
  a bounded page limit.
- Roadmap filtering and grouping recomputed on every render. Derived collections are
  memoized and off-screen category/card rendering uses CSS containment.
- `_app.getInitialProps` disabled page-level optimization. It was removed while page-local
  server rendering preserves the per-response CSP nonce.

## Runtime observability

The roadmap HTML response and `/api/roadmap-data` expose:

- `Server-Timing`: authorization, roadmap data, and total durations.
- `X-Roadmap-Data-Cache`: `hit`, `stale`, or `miss`.
- `X-Roadmap-Instance`: the resolved instance on the aggregate API.

The SharePoint proxy continues to expose `x-sp-proxy-ms` for upstream latency.

## Cache controls

Defaults are documented in `.env.example`:

- `ROADMAP_DATA_CACHE_TTL_MS=60000`
- `ROADMAP_DATA_STALE_TTL_MS=300000`
- `ROADMAP_ACCESS_CACHE_TTL_MS=60000`
- `ROADMAP_ACCESS_DENIED_CACHE_TTL_MS=15000`
- `ROADMAP_MIRRORING_CACHE_TTL_MS=60000`
- `ROADMAP_MIRRORING_CONCURRENCY=3`
- `ROADMAP_APP_SETTINGS_CACHE_TTL_MS=60000`

These caches are process-local. A multi-worker deployment gets one cache per worker; use
sticky traffic or an external shared cache if cross-worker hit rate becomes important.
