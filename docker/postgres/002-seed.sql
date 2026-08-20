\set ON_ERROR_STOP on

BEGIN;

INSERT INTO "RoadmapInstance" (
  "slug",
  "displayName",
  "description",
  "sharePointSiteUrlDev",
  "sharePointSiteUrlProd",
  "sharePointStrategy",
  "allowSelfSigned",
  "deploymentEnv",
  "defaultLocale",
  "defaultTimeZone",
  "landingPage",
  "settingsJson",
  "createdAt",
  "updatedAt"
)
VALUES (
  'sample',
  'Sample Roadmap',
  'Lokale Demo-Instanz mit Beispielprojekten für die Roadmap-Entwicklung.',
  'https://example.invalid/sites/roadmap-sample',
  'https://example.invalid/sites/roadmap-sample',
  'kerberos',
  false,
  'development',
  'de-CH',
  'Europe/Zurich',
  'sample',
  '{"features":{"sampleData":true},"metadata":{"sampleData":true,"seededBy":"docker/postgres/002-seed.sql"}}',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("slug") DO UPDATE SET
  "displayName" = EXCLUDED."displayName",
  "description" = EXCLUDED."description",
  "sharePointSiteUrlDev" = EXCLUDED."sharePointSiteUrlDev",
  "sharePointSiteUrlProd" = EXCLUDED."sharePointSiteUrlProd",
  "sharePointStrategy" = EXCLUDED."sharePointStrategy",
  "allowSelfSigned" = EXCLUDED."allowSelfSigned",
  "deploymentEnv" = EXCLUDED."deploymentEnv",
  "defaultLocale" = EXCLUDED."defaultLocale",
  "defaultTimeZone" = EXCLUDED."defaultTimeZone",
  "landingPage" = EXCLUDED."landingPage",
  "settingsJson" = EXCLUDED."settingsJson",
  "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "SuperAdmin" (
  "username",
  "normalizedUsername",
  "isActive",
  "note",
  "createdAt",
  "updatedAt"
)
VALUES (
  'fabian.boni@jsd.bs.ch',
  'fabian.boni@jsd.bs.ch',
  true,
  'Local Docker development seed',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("normalizedUsername") DO UPDATE SET
  "username" = EXCLUDED."username",
  "isActive" = EXCLUDED."isActive",
  "note" = EXCLUDED."note",
  "updatedAt" = CURRENT_TIMESTAMP;

COMMIT;

