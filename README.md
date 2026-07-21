# SharePoint Roadmap (Next.js 14)

SharePoint-backed roadmap application built with Next.js 14 (pages router), TypeScript, Tailwind CSS, and PM2. It integrates with SharePoint via resilient fetch fallbacks and supports Kerberos (SPNEGO), delegated access, and optional basic auth.

## Tech Stack

- Next.js 14 (pages router), React 18, TypeScript
- Tailwind CSS for styling
- SharePoint REST with custom fetch fallback
- Prisma (included, optional) and PM2 for process management

## Architecture

- **API pattern**: Next.js API route → `utils/clientDataService` → `/api/sharepoint` proxy → SharePoint REST.
- **Data layer**: `clientDataService` handles SharePoint access (OData nometadata → verbose → Atom XML cascade, field probing, caching).
- **SharePoint lists**: `Roadmap Projects`, `Roadmap Categories`, `Roadmap Settings`, `Roadmap Team Members`, `Roadmap Project Links`.
- **Category normalization**: trim and collapse values like `7.0` → `7` across API and client data service.
- **Quarter → date derivation**: shared helper maps Q1–Q4 to start/end ISO dates; do not change logic.
- **Admin check**: `clientDataService.isCurrentUserAdmin()` (site collection admin, owners group, heuristic owners).
- **Caching**: in-memory only (list titles, field metadata, request digests); avoid persistent caches.

## Setup

1. **Requirements**: Node 20.x (repo ships `node-bin` v20.11.1 if you need a pinned runtime) and Yarn 1.22.22. Run `corepack enable` if Yarn isn't available yet.
2. **Install**: `yarn install --frozen-lockfile`.
3. **Env**: copy `.env.example` to `.env` and set values. Key vars:
   - `NEXT_PUBLIC_DEPLOYMENT_ENV` (`dev`|`production`)
   - `INTERNAL_API_BASE_URL` (absolute server URL for SSR fetches)
   - `PUBLIC_PROJECTS_API_KEYS` (comma-separated keys for `/api/public/projects`; `ROADMAP_API_KEY` is supported as a single-key alias and can come from GitHub Secrets)
   - `SP_STRATEGY` (deprecated for proxy; Kerberos is the hardcoded default)
   - `SP_USE_CURL` (deprecated; Kerberos proxy uses curl unconditionally)
   - `NEXT_PUBLIC_BASE_PATH_DEV` / `NEXT_PUBLIC_BASE_PATH_PROD` (reverse proxy base paths)
   - SharePoint site/web URLs and credentials for the active strategy (see `utils/sharepointEnv.ts`).
4. **Run dev**: `yarn dev` (port 3000, Turbo mode enabled via `next dev --turbo`).
5. **Build**: `yarn build`; **start**: `yarn start`.

## Auth Modes

- **kerberos**: Server proxy uses `curl --negotiate` (hardcoded; no `SP_USE_CURL` flag required).
- **basic**: Basic auth header (only if your SharePoint supports it).
- **delegated**: forward authenticated user context when the surrounding setup supports it.

## Development Workflow

- Lint: `yarn lint` (fix: `yarn lint:fix`).
- Format: `yarn format` (check: `yarn format:check`).
- Security audit: `yarn security:audit`.
- Prisma: `yarn prisma:generate | migrate | deploy | studio | seed`.
- SharePoint auth diagnostics: use `/api/auth/whoami` and proxy debug logs.
- PM2 ops: `yarn pm2:restart | yarn pm2:stop | yarn pm2:logs | yarn pm2:status` (see `ecosystem.config.js`).

## Local Support Chat

- The floating chat widget is available throughout the application; support staff answer at `/admin/support-chat`.
- Chat conversations are stored by Prisma in the local SQLite file configured through `DATABASE_URL`. No external chat service is used.
- The browser receives only a random `HttpOnly` conversation token. The database stores its SHA-256 hash, not the token itself.
- New deployments must apply the chat tables with `yarn prisma:deploy` before the application is restarted.
- The widget and support inbox poll the local Next.js API while open, so the existing `next start`/PM2 setup requires no additional realtime process.

## Conventions and Guardrails

- Use `clientDataService` for new APIs; add new fields only to `candidateFields` (probing handles validity).
- Do not alter the OData/XML fallback cascade or quarter derivation logic.
- Avoid hardcoding SharePoint URLs; use `resolveSharePointSiteUrl()` / `clientDataService.getWebUrl()`.
- Join related lists client-side via `ProjectId` (see `getAllProjects()` pattern).
- Admin pages wrap components with `withAdminAuth` HOC.

## Deployment Notes

- PM2 runs the built app on port 3000 (see `ecosystem.config.js`).
- Build output lives in `.next`; keep it out of version control.
- Self-hosted Windows GitHub runner expected; use `yarn pm2:restart` after deploy.
- GitHub Actions can inject public API keys from `PUBLIC_PROJECTS_API_KEYS` or `ROADMAP_API_KEY` secrets into the generated `.env` during branch builds and deploys.

## Troubleshooting

- **Auth failures**: verify site URLs and credentials; for Kerberos ensure the server process has a valid SPNEGO/Kerberos context (proxy uses curl negotiate).
- **Field select errors**: rely on field probing; if adding fields, append to `candidateFields` only.
- **Categories mismatch**: ensure normalization logic is applied when writing new code.

## Security

- Never commit real secrets. `.env` and `.env.*.local` are git-ignored; keep example values non-sensitive.
