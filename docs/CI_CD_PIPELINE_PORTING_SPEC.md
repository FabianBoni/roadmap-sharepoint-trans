# CI/CD Pipeline Porting Specification

## Purpose

This document is the implementation contract for reproducing this repository's CI/CD mechanism in another repository. It is written for an LLM or engineer performing the port. It describes the behavior that must be preserved, the values that must be adapted, the external GitHub and runner configuration that is not stored in Git, and the checks that prove the port is complete.

The current implementation uses four GitHub Actions workflows:

| Concern                                           | Canonical source                     | Execution host                     |
| ------------------------------------------------- | ------------------------------------ | ---------------------------------- |
| Untrusted branch and pull-request validation      | `.github/workflows/branch-build.yml` | GitHub-hosted Ubuntu               |
| Secret and dependency security gates              | `.github/workflows/security.yml`     | GitHub-hosted Ubuntu               |
| Production database migration, build, and restart | `.github/workflows/deploy.yml`       | Dedicated self-hosted Linux runner |
| History-free sanitized repository publication     | `.github/workflows/mirror.yml`       | GitHub-hosted Ubuntu               |

Supporting contracts are implemented by:

- `package.json`: locked tool versions and the build, lint, security-test, performance, Prisma, and PM2 commands.
- `yarn.lock`: reproducible dependency installation.
- `scripts/run-security-tests.mjs`: discovers and runs every `tests/security/**/*.test.ts` test with insecure TLS settings forced off.
- `scripts/check-performance-budgets.mjs`: checks the built `/roadmap` JavaScript payload against raw and gzip budgets.
- `prisma/schema.prisma` and `prisma/migrations/`: PostgreSQL schema and reviewed forward migrations.
- `ecosystem.config.js`: the single PM2 application definition.
- `pages/api/health/ready.ts`: the local post-restart readiness endpoint.
- `.env.example`: the full runtime configuration inventory.

When the implementation and this document disagree, the workflow files are authoritative for current behavior. Update this document whenever the mechanism changes.

## Desired final state

A conforming port has these properties:

1. Code from branches and pull requests is tested on an ephemeral GitHub-hosted runner and never receives production secrets.
2. Production deployment is possible only from `main`, through a protected GitHub Environment, on a dedicated unprivileged self-hosted runner.
3. Every dependency install uses the committed Yarn lockfile. Third-party Actions are pinned to immutable commit SHAs.
4. Production configuration is assembled without logging secrets, stored as `.env` with mode `0600`, and validated before migration, build, or restart.
5. Production uses PostgreSQL and only reviewed Prisma migrations (`prisma migrate deploy`); it never uses `prisma db push` or `--accept-data-loss`.
6. Type checking, lint, security regression tests, runtime dependency audit, production build, and performance budgets must pass before PM2 is restarted.
7. Only the named application process is restarted. A failed pre-restart gate leaves the currently running process untouched.
8. A sanitized mirror contains one new root commit representing the current `main` tree, no source history, no Actions workflows, no environment files, and no database files.
9. Workflows use least-privilege `contents: read`, do not persist checkout credentials, have explicit timeouts, and control concurrent execution where state can collide.

## Event and trust model

The workflows are intentionally separate and have no cross-workflow dependency:

```text
feature/fix/refactor push
  -> Branch Security Build

pull request targeting main
  -> Branch Security Build
  -> Security gates (Gitleaks + dependency review)

push to main
  -> Security gates (Gitleaks + Yarn production audit)
  -> Build and Deploy (protected production environment)
  -> Publish sanitized snapshot
```

The three `main` workflows start independently. The deploy repeats the important compilation, security-test, dependency-audit, build, and performance gates rather than relying on another workflow's result. The mirror can publish even if deployment fails. Preserve that independence for a faithful port; introducing workflow chaining is a design change.

Use branch protection to ensure untrusted changes pass required checks before they can enter `main`. The workflow itself is not a replacement for branch protection.

## Parameters an LLM must resolve before editing

Do not blindly copy repository-specific values. Inspect the target repository and construct a mapping for every item below.

| Parameter                     | Current value                                              | How to adapt it                                                                                                                                            |
| ----------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Production branch             | `main`                                                     | Use the target's protected release branch. Update all four triggers and Environment deployment rules together.                                             |
| Package manager               | Yarn Classic `1.22.22`                                     | Preserve if the target has a compatible `yarn.lock`; otherwise translate every install/audit/script call consistently and retain frozen-lockfile behavior. |
| Node version                  | `22.20.0` for build/deploy; `20` in the security audit job | Prefer one explicitly supported, pinned target version. Do not silently use the runner's preinstalled Node.                                                |
| Deployment runner labels      | `self-hosted`, `linux`, `roadmap`                          | Replace the application label with a unique target-runner label. Keep `self-hosted` and `linux`.                                                           |
| Deployment OS account         | `roadmap`                                                  | Replace both the required username check and runner provisioning with a dedicated, non-root, no-sudo service account.                                      |
| GitHub Environment            | `production`                                               | Create or map to the target's protected production Environment.                                                                                            |
| Deployment concurrency group  | `roadmap-production`                                       | Replace with a repository/application-specific constant. Keep `cancel-in-progress: false`.                                                                 |
| Checkout directory            | `${{ github.workspace }}/source`                           | Keep a stable absolute subdirectory because PM2 runs the application from this location.                                                                   |
| PM2 application name          | `roadmap-app`                                              | Change in `ecosystem.config.js`, package scripts, and the workflow's `--only` argument as one atomic edit.                                                 |
| Application port              | `3000`                                                     | Change the PM2 configuration and readiness URL together.                                                                                                   |
| Readiness route               | `/api/health/ready`                                        | Implement an equivalent route in the target and update the probe path.                                                                                     |
| Prisma expected tables        | Ten application tables listed in `deploy.yml`              | Derive from the target schema. Do not leave the Roadmap table list in another application.                                                                 |
| Performance route and budgets | `/roadmap`, 300,000 gzip bytes, 1,000,000 raw bytes        | Derive from the target build manifest and performance requirements.                                                                                        |
| Mirror repository             | `JSD-IT/Roadmap`                                           | Replace with the authorized owner/repository.                                                                                                              |
| Mirror branch                 | `main`                                                     | Match the target mirror's intended default branch.                                                                                                         |
| Mirror host                   | `github.com` unless overridden                             | Keep the validated override only if GitHub Enterprise Server is supported.                                                                                 |
| Branch push patterns          | `feature/**`, `features/**`, `fix/**`, `refactor/**`       | Match the target's branch naming conventions; PR validation still covers every PR targeting the protected branch.                                          |

If the target is not a Node/Next.js/Prisma/PM2 application, preserve the trust boundaries and gate ordering while replacing the stack-specific commands with target-native equivalents. Document each deliberate semantic deviation.

## Repository prerequisites

Before adding workflows, ensure the target contains all of the following:

- A committed dependency lockfile and a package-manager version declaration.
- Scripts equivalent to type-check, lint, security regression tests, production dependency audit, production build, and performance-budget validation.
- Production-only dependencies required to start the app. This repository installs development dependencies too because Prisma, TypeScript, ESLint, the test runner, and PM2 are in `devDependencies`.
- Reviewed Prisma migrations and a PostgreSQL datasource, if the target retains Prisma.
- A PM2 ecosystem file naming exactly one deployable application.
- A readiness endpoint reachable over loopback without disclosing sensitive configuration.
- `.gitignore` rules equivalent to the current repository: `.env`, `.env*.local`, `.env.production`, `.env.development`, `.next`, PM2 data, logs, dependency directories, and local database files. Keep `.env.example` committable. Broader `.env.*` ignore rules are a valid hardening if the target does not intentionally commit encrypted environment vaults.
- Security tests that fail closed when none are discovered. Here, `scripts/run-security-tests.mjs` recursively finds `tests/security/**/*.test.ts` and exits with failure if the set is empty.
- A performance script that reads build output and fails when its budgets are exceeded. It must run only after a successful production build.

## Required GitHub configuration

These controls live outside the repository and must be created explicitly.

### Protected branch

Protect `main` with:

- Pull requests required; disallow direct pushes.
- At least one independent approving review.
- Code-owner review for workflow, security, migration, and deployment files.
- Required successful checks from Branch Security Build and Security gates.
- Conversation resolution and stale-review dismissal as appropriate for the organization.
- GitHub secret scanning and push protection enabled.

Run the workflows once before selecting required checks, then select the exact check names GitHub reports. Do not guess names that have never been registered.

### Protected `production` Environment

Create a GitHub Environment named `production` and configure:

- Required reviewers.
- Deployment branch restriction allowing only `main`.
- Environment secrets listed below.

Production secrets must be Environment secrets, not secrets exposed to untrusted branch workflows.

#### Deployment secrets

| Secret                           | Required | Purpose                                                                                                                               |
| -------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `env`                            | No       | Baseline multiline `.env` content for non-overridden application settings. The lowercase name is intentional in the current workflow. |
| `ENTRA_TENANT_ID`                | Yes      | Microsoft Entra tenant.                                                                                                               |
| `ENTRA_CLIENT_ID`                | Yes      | Entra application/client ID.                                                                                                          |
| `ENTRA_CLIENT_SECRET`            | Yes      | Entra confidential-client secret.                                                                                                     |
| `ENTRA_REDIRECT_URI`             | Yes      | Exact absolute callback URI.                                                                                                          |
| `ENTRA_POST_LOGOUT_REDIRECT_URI` | No       | Explicit post-logout destination.                                                                                                     |
| `JWT_SECRET`                     | Yes      | Application-session signing secret; at least 32 characters.                                                                           |
| `INTERNAL_API_SECRET`            | Yes      | Independent internal-request signing secret; at least 32 characters.                                                                  |
| `APP_ORIGIN`                     | Yes      | Fixed external application origin.                                                                                                    |
| `DATABASE_URL`                   | Yes      | PostgreSQL connection URL including database, username, password, and host. A `schema` query parameter is recommended.                |
| `INTERNAL_API_BASE_URL`          | Yes      | Fixed absolute internal base URL; do not derive from request headers.                                                                 |
| `CLAMAV_HOST`                    | Yes      | Reachable malware scanner host.                                                                                                       |
| `CLAMAV_PORT`                    | No       | Scanner port override.                                                                                                                |
| `CLAMAV_TIMEOUT_MS`              | No       | Scanner timeout override.                                                                                                             |
| `PUBLIC_PROJECTS_API_KEYS`       | No       | Comma-separated public API keys.                                                                                                      |
| `SP_KERBEROS_SERVICE_USER`       | Yes      | SharePoint Kerberos service identity.                                                                                                 |
| `SP_KERBEROS_SERVICE_PASSWORD`   | Yes      | SharePoint Kerberos service password.                                                                                                 |

The port must classify target-specific settings the same way: security-sensitive or authoritative values get individual Environment secrets; non-sensitive bulk configuration can remain in the protected baseline `env` secret.

Individual values always override the baseline. The materialization step removes every override key from the baseline first, then appends each non-empty individual secret as a JSON-quoted dotenv value. This guarantees one authoritative definition and safely escapes special characters. It writes `.env` under `umask 077`, explicitly sets mode `0600`, and never prints the content.

### Mirror credential

Create `TARGET_REPO_PAT` with the minimum permission needed to force-update the target repository's chosen branch. Store it as a secret available to `mirror.yml`. If publishing to GitHub Enterprise Server, optionally create `TARGET_HOST`; otherwise the workflow uses `github.com`.

The credential must not be placed in the remote URL or persisted by checkout. The workflow passes it through a temporary `GIT_ASKPASS` script.

## Self-hosted production runner contract

Provision a dedicated Linux runner with all of these properties:

- It is registered only where the target repository can select it and has the labels `self-hosted`, `linux`, and the application-specific label.
- The runner service executes as the dedicated application account (`roadmap` here), never UID 0, and that account has no general sudo access.
- The account owns the Actions workspace and `$HOME/.pm2`; other local users cannot read the workspace, `.env`, runner credentials, or PM2 state.
- The host has Bash, Git, curl, tar, and the libraries required by the application. The Node toolchain is still selected by `actions/setup-node` and verified by the workflow.
- Egress is restricted to GitHub/Actions, the package registry, PostgreSQL, ClamAV, SharePoint, Entra endpoints, and other application dependencies. Only the reverse proxy may reach the application port as appropriate.
- Disk capacity covers two dependency/build cycles plus runner temporary data. Monitoring covers disk, PM2, and the reverse proxy.
- The reverse proxy terminates TLS and forwards to `127.0.0.1:3000` (or the adapted loopback port).
- Host backup/restore and PostgreSQL backup/restore are tested before migrations are deployed.

The workflow itself enforces the non-root account and sets a fixed system `PATH`. This reduces accidental dependence on user-controlled binaries. Do not remove those checks merely because the runner is believed to be configured correctly.

## Workflow specifications

### 1. Branch Security Build

Create `.github/workflows/branch-build.yml` with the following semantics:

- Trigger on pushes to the configured untrusted branch patterns, every pull request targeting `main`, and manual dispatch.
- Grant only `contents: read`.
- Use a concurrency key containing the workflow and full ref, with `cancel-in-progress: true`, so a newer commit cancels obsolete work on the same ref.
- Run on `ubuntu-latest` with a 20-minute timeout.
- Set `CI=true`, disable Next telemetry, use `NODE_ENV=test`, a disposable CI database URL, and fixed visibly non-production placeholders for required signing secrets. Never reference `${{ secrets.* }}` in this workflow.
- Checkout with `persist-credentials: false` using an immutable Action commit SHA.
- Install the exact Node version and enable Yarn caching.
- Run, in order:

  1. `yarn install --frozen-lockfile --non-interactive`
  2. `yarn prisma generate`
  3. `yarn tsc --noEmit`
  4. `yarn lint --max-warnings 100`
  5. `yarn test:security`
  6. `yarn audit --groups dependencies --level low`
  7. `NODE_ENV=production yarn build`
  8. `yarn perf:budget`

The CI database placeholder is `file:./ci.db` even though the current Prisma datasource is PostgreSQL. It is sufficient only because these gates generate the client and build but do not connect or migrate. If target tests connect to the database, provision an isolated ephemeral service and never reuse production.

The lint threshold of 100 and low-severity audit threshold are current behavior, not universal recommendations. Preserve them for an exact port or intentionally tighten them in a separately reviewed change.

### 2. Security gates

Create `.github/workflows/security.yml` with read-only contents permission and two independent jobs, each limited to 10 minutes.

`secret-scan` must:

1. Run for pushes and pull requests targeting `main`.
2. Checkout full history with `fetch-depth: 0` and `persist-credentials: false`.
3. Run `gitleaks/gitleaks-action` pinned to an immutable commit SHA, with only the ephemeral `${{ github.token }}`.

`dependency-review` must use event-specific behavior:

- On every event, checkout with `persist-credentials: false`.
- On a push, set up Node, install the frozen lockfile, and run `yarn audit --groups dependencies --level low`.
- On a pull request, run `actions/dependency-review-action` pinned to an immutable SHA and reject newly introduced vulnerabilities of `moderate` severity or higher.

Do not run dependency review on push events because it needs a pull-request comparison. Do not replace the full-history Gitleaks checkout with a shallow checkout.

### 3. Verified production deployment

Create `.github/workflows/deploy.yml` with these top-level constraints:

- Trigger only on pushes to `main` and manual dispatch.
- Grant only `contents: read`.
- Use one application-specific concurrency group with `cancel-in-progress: false`. Deployments serialize; an in-flight migration/build is never canceled by a newer push.
- Select `[self-hosted, linux, <application-label>]`.
- Attach the job to the protected `production` Environment.
- Set a 30-minute timeout.
- Default every shell step to Bash in `${{ github.workspace }}/source`.

Implement the following stages in this exact order.

#### A. Establish the runner boundary

From `${{ github.workspace }}`, fail unless the UID is nonzero and the username is the dedicated expected account. Set `umask 077` and publish a fixed `/usr/local/...:/usr/...:/bin` PATH through `$GITHUB_ENV`.

Checkout the protected revision into `source` with a shallow clone, `persist-credentials: false`, and `clean: true`. Set up the exact Node version. Run `corepack enable`, then assert both `node --version` and `yarn --version` exactly match the declared versions.

#### B. Reclaim and isolate dependency-cache space

Resolve `yarn cache dir` and refuse deletion unless the result is below either `$HOME/.cache/yarn/` or `$HOME/.yarn/`. Clean Yarn's cache, recreate `$RUNNER_TEMP/yarn-cache`, and display filesystem capacity without displaying configuration.

This safety check is part of the mechanism: never run recursive deletion against an unvalidated cache path. The temporary cache is removed under `if: always()` at the end.

#### C. Materialize and validate runtime configuration

Pass the baseline and individual Environment secrets only to this step. The embedded Node script must:

1. Define a closed allowlist of individual override keys.
2. Fail if any required override is empty.
3. Require both signing secrets to contain at least 32 characters.
4. Remove all override-key definitions from the baseline content.
5. Append every non-empty override as `KEY=<JSON-stringified-value>`.
6. Write exactly one `.env` with mode `0600` and no logged secret values.

Install all locked dependencies, including development dependencies, using the isolated cache:

```bash
yarn install --frozen-lockfile --non-interactive --production=false
```

Load `.env` and reject the deployment unless required application settings exist. The current implementation additionally enforces:

- `SP_ALLOW_SELF_SIGNED`, `SP_TLS_FALLBACK_INSECURE`, `SP_PROXY_DEBUG`, `SP_CURL_VERBOSE`, and `ENABLE_SECURITY_DEBUG_ENDPOINTS` may not equal the string `true`.
- `NODE_TLS_REJECT_UNAUTHORIZED` may not equal `0`.
- `DATABASE_URL` must parse as `postgres:` or `postgresql:`, include a host, username, and password, and have a pathname other than `/`. The current check does not separately reject an empty pathname; requiring a non-empty database name would be an intentional hardening.

Adapt the closed lists to the target, but preserve fail-closed validation before any database mutation.

#### D. Prepare and migrate PostgreSQL

Run `yarn prisma generate`.

Normalize the Prisma target schema:

1. Parse `DATABASE_URL` and reject line breaks.
2. If it already has a `schema` query parameter, use it.
3. Otherwise query `SELECT current_schema()`, append that result as the URL's encoded `schema` parameter, replace the single `DATABASE_URL` entry in `.env`, mask the normalized URL, and add it to `$GITHUB_ENV` for later steps.
4. Fail unless `.env` contained exactly one `DATABASE_URL` definition.

Inspect the deployment role's current-schema privileges and relevant table permissions. In particular, if `_prisma_migrations` exists, fail unless the role has SELECT plus INSERT/UPDATE/DELETE on it. Log only privilege booleans and identifiers, not credentials.

The current permission inspection considers `_prisma_migrations` plus these application tables: `RoadmapInstance`, `RoadmapInstanceHost`, `SuperAdmin`, `InstanceDepartmentAccess`, `FeedbackRequest`, `FeedbackVote`, `SupportConversation`, `SupportMessage`, `RateLimitBucket`, and `AuthSession`. The post-migration completeness check requires those ten application tables. Replace both lists from the target schema; the lists serve different checks and must remain consistent with the same schema version.

Apply reviewed migrations with exactly:

```bash
yarn prisma migrate deploy
```

Then query `pg_catalog.pg_tables` in `current_schema()` and fail if any target-specific required application table is absent. Derive this list from the target's Prisma schema and migration baseline.

Do not use `prisma migrate dev`, `prisma db push`, destructive reset commands, or flags that accept data loss in production.

#### E. Repeat release gates on the trusted runner

Run, in order:

1. `yarn tsc --noEmit`
2. `yarn lint --max-warnings 100`
3. `yarn test:security`
4. `yarn audit --groups dependencies --level low`
5. `NODE_ENV=production yarn build`
6. `yarn perf:budget`

The production deployment deliberately does not trust artifacts from untrusted runners and does not download a prebuilt bundle. It builds in the final checkout using the protected runtime configuration.

#### F. Restart one PM2 process

The PM2 binary must be a locked local dependency at `node_modules/.bin/pm2`; fail if it is missing. Do not invoke a globally installed PM2.

Set `NODE_ENV=production`, the application port, `PM2_HOME=$HOME/.pm2`, and an empty `RUNNER_TRACKING_ID`. The last setting prevents Actions orphan-process cleanup from killing the long-lived PM2 daemon. Execute:

```bash
node_modules/.bin/pm2 startOrRestart ecosystem.config.js --only <application-name> --update-env
node_modules/.bin/pm2 save
```

The ecosystem file must run `next start` (or the target server) from the checkout directory, enable autorestart, and define bounded restart behavior. Never run `pm2 restart all`, because the host can contain unrelated services.

#### G. Probe loopback and clean up

Probe the local readiness URL up to 24 times, five seconds apart, with a five-second curl timeout. The current workflow treats any received HTTP status other than curl's `000` as success; therefore it verifies reachability, not semantic readiness. The endpoint itself returns `200` when ready and `503` otherwise, but the workflow accepts both.

For exact behavioral fidelity, preserve that rule. For a stronger target implementation, deliberately change the acceptance condition to the endpoint's documented success status (normally `200`-`299`) and record this as a deviation rather than silently claiming identical behavior.

Finally remove only the validated `$RUNNER_TEMP/yarn-cache` directory under `if: always()`.

### 4. Sanitized snapshot publication

Create `.github/workflows/mirror.yml` with these semantics:

- Trigger on `main` pushes and manual dispatch.
- Grant only `contents: read`, run on GitHub-hosted Ubuntu, and time out after 10 minutes.
- Keep the destination repository and branch as non-secret constants. Read the PAT from `TARGET_REPO_PAT`; allow `TARGET_HOST` to default to `github.com`.
- Validate the host against `^[A-Za-z0-9.-]+$` and the `owner/repository` string against `^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$` before checkout.
- Checkout only the current protected revision with `fetch-depth: 1` and `persist-credentials: false`.

Build the snapshot under `$RUNNER_TEMP` by extracting `git archive HEAD`. This copies only the committed tree and no `.git` history. Then:

1. Remove the entire `.github/workflows` directory.
2. Recursively delete `*.db`, `*.sqlite`, `*.sqlite3`, `.env`, and `.env.*`, except `.env.example`.
3. Initialize a new Git repository on the target branch.
4. Create one commit named `Sanitized snapshot of ${GITHUB_SHA}` using the GitHub Actions bot identity.
5. Add the HTTPS remote without credentials in its URL.
6. Use a mode-`0700` temporary askpass script and `GIT_TERMINAL_PROMPT=0` to authenticate.
7. Force-push only `HEAD:refs/heads/<target-branch>`.

Do not replace this with `git push --mirror`, a history-preserving clone, or a push of source workflows. The destructive force-push is authorized only for the explicitly configured sanitized-snapshot repository and branch.

The filename filters are a minimum, not a proof that arbitrary committed secrets are absent. Gitleaks, source review, and secret rotation remain required.

## Supply-chain rules

Every `uses:` entry must be pinned to a full immutable commit SHA. A version comment may follow the SHA for readability, for example:

```yaml
uses: actions/checkout@<full-commit-sha> # vX.Y.Z
```

Before porting, verify current trusted releases from the Action publisher and update the SHA intentionally. Do not substitute floating tags such as `@main`, `@v4`, or `@latest`. Keep checkout credentials disabled unless a narrowly scoped later step explicitly requires them.

Do not add broad write permissions at workflow level. The mirror writes through its dedicated PAT; normal checkout and validation need only read access.

## Porting procedure for an LLM

Execute this sequence when embedding the mechanism in another repository:

1. Inventory the target's language, package manager, lockfile, build/test commands, database tool, process manager, release branch, existing workflows, readiness endpoint, deployment topology, and secret names.
2. Read repository-local agent/contribution instructions and preserve unrelated user changes.
3. Produce the parameter mapping from this document. Mark each item `preserve`, `adapt`, or `not applicable`, with a reason for every non-preserved behavior.
4. Add or adapt the repository contracts first: scripts, runtime process definition, health endpoint, ignore rules, migrations, security tests, and performance checks.
5. Add the branch validation and security workflows. Ensure neither references production secrets.
6. Add the deployment workflow and replace all coupled identifiers atomically: branch, Environment, runner labels/account, app name, port, readiness URL, expected tables, commands, secret allowlists, required settings, and unsafe-setting denylist.
7. Add the sanitized mirror only if the target requires publication to a second repository. Confirm the exact destructive destination before enabling force-push.
8. Validate YAML syntax and search for stale source-repository identifiers.
9. Run every local command invoked by CI where the local environment permits it.
10. Configure the GitHub Environment, secrets, runner, branch protection, required checks, mirror credential, reverse proxy, network policy, and backups. Repository files alone do not complete the port.
11. Open a test pull request and confirm untrusted jobs have no production Environment or secrets.
12. Perform a reviewed deployment, observe migration/build/PM2/readiness behavior, and test restore/rollback operations.

Never invent secret values, runner registration tokens, database credentials, target repository names, or required table lists. If they cannot be derived from the target, leave an explicit operator action rather than committing placeholders that appear production-ready.

## Acceptance checklist

A port is complete only when evidence exists for every applicable item.

### Static repository evidence

- [ ] Four workflows exist, or the mirror is explicitly documented as not applicable.
- [ ] Workflow triggers match the protected branch and intended feature branch patterns.
- [ ] All workflows declare least-privilege permissions and explicit timeouts.
- [ ] All third-party Actions use full commit SHAs.
- [ ] Every checkout disables credential persistence; Gitleaks alone fetches full history.
- [ ] The branch workflow contains no production secret expressions.
- [ ] Locked installs, type-check, lint, security tests, audit, build, and performance gates are present in both branch validation and deployment where applicable.
- [ ] Deployment serializes without canceling work and uses the protected Environment plus dedicated runner labels.
- [ ] Runner UID/username, fixed PATH, safe cache-path, dotenv mode, secret length, unsafe configuration, PostgreSQL URL, migration permission, and expected-table checks are present.
- [ ] Production uses only reviewed non-destructive migrations.
- [ ] PM2 uses the locked local binary and `--only <target-app>`.
- [ ] Readiness app/port/path and PM2 app/port/cwd agree.
- [ ] The mirror builds from `git archive`, removes workflows/env/database files, makes one root commit, and force-pushes only the explicit branch through askpass.
- [ ] No stale `roadmap`, `roadmap-app`, `/roadmap`, Roadmap table, `JSD-IT/Roadmap`, source secret, source URL, or source runner value remains unless intentionally valid for the target.
- [ ] This document or an adapted copy records every intentional deviation.

### External and runtime evidence

- [ ] `main` requires pull requests, reviews, and the registered CI/security checks.
- [ ] The `production` Environment requires reviewers and restricts deployments to `main`.
- [ ] Required Environment secrets exist; untrusted workflows cannot access them.
- [ ] Secret scanning and push protection are enabled.
- [ ] The runner is Linux, uniquely labeled, non-root, dedicated, minimally privileged, and network-restricted.
- [ ] PostgreSQL and application backups exist and a restore has been tested.
- [ ] A pull request demonstrates all untrusted gates passing without production secrets.
- [ ] A deployment demonstrates locked installation, configuration validation, migration, schema verification, release gates, one-process PM2 restart, and loopback probe.
- [ ] A failed pre-restart gate leaves the old PM2 process running.
- [ ] A mirror run produces exactly one history-free commit and contains none of the excluded file classes.

## Operational limitations inherited from the current mechanism

An exact port also inherits these constraints; do not hide them from operators:

- This is an in-place deployment from a persistent self-hosted workspace, not an immutable artifact, blue/green release, or atomic directory swap.
- Database migrations occur before type-check, lint, tests, audit, and build in the production job. A later gate failure can leave the schema advanced while the old process continues running. Migrations therefore must be backward-compatible with the currently running version.
- There is no automated application or database rollback. Recovery uses PM2/source redeployment plus the separately tested database restore procedure.
- The current post-restart probe establishes TCP/HTTP reachability but accepts HTTP error statuses.
- The security, deploy, and mirror workflows on `main` are independent. The mirror is not evidence that production deployed successfully.
- `yarn audit --level low` can fail a deployment because of newly published advisories even when source code is unchanged; emergency exceptions require explicit security review, never weakening the workflow silently.
- A persistent self-hosted runner must be treated as sensitive infrastructure. Reprovision it and rotate runner tokens/secrets if compromise is suspected.

These limitations can be improved in a future design, but improvements should be specified and reviewed as behavioral changes rather than presented as an identical port.
