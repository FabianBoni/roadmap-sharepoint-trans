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

INSERT INTO "FeedbackRequest" (
  "title",
  "description",
  "createdBy",
  "createdByName",
  "status",
  "completedAt",
  "completedBy",
  "createdAt",
  "updatedAt"
)
VALUES
  (
    'Roadmap als PDF exportieren',
    'Eine kompakte PDF-Ansicht soll sich für Sitzungen und den Versand an Stakeholder exportieren lassen.',
    'seed:sample:feedback-pdf-export',
    'Roadmap Demo',
    'OPEN',
    NULL,
    NULL,
    '2026-08-10 09:00:00+00',
    CURRENT_TIMESTAMP
  ),
  (
    'Favoriten und persönliche Ansichten',
    'Nutzerinnen und Nutzer möchten häufig verwendete Projekte markieren und als persönliche Ansicht speichern.',
    'seed:sample:feedback-favorites',
    'Roadmap Demo',
    'OPEN',
    NULL,
    NULL,
    '2026-08-14 13:30:00+00',
    CURRENT_TIMESTAMP
  ),
  (
    'Direkter Excel-Export der Roadmap',
    'Die gefilterte Roadmap kann jetzt direkt als Excel-Datei heruntergeladen und weiterverarbeitet werden.',
    'seed:sample:feedback-excel-export',
    'Roadmap Demo',
    'COMPLETED',
    '2026-08-20 10:00:00+00',
    'fabian.boni@jsd.bs.ch',
    '2026-07-28 08:15:00+00',
    CURRENT_TIMESTAMP
  );

INSERT INTO "FeedbackVote" (
  "feedbackId",
  "userKey",
  "value",
  "createdAt",
  "updatedAt"
)
SELECT request."id", vote."userKey", 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (
  VALUES
    ('seed:sample:feedback-pdf-export', 'seed:sample:user:anna'),
    ('seed:sample:feedback-pdf-export', 'seed:sample:user:marco'),
    ('seed:sample:feedback-pdf-export', 'seed:sample:user:samira'),
    ('seed:sample:feedback-favorites', 'seed:sample:user:anna'),
    ('seed:sample:feedback-favorites', 'seed:sample:user:marco'),
    ('seed:sample:feedback-excel-export', 'seed:sample:user:anna'),
    ('seed:sample:feedback-excel-export', 'seed:sample:user:marco'),
    ('seed:sample:feedback-excel-export', 'seed:sample:user:samira'),
    ('seed:sample:feedback-excel-export', 'seed:sample:user:noah')
) AS vote("createdBy", "userKey")
JOIN "FeedbackRequest" request ON request."createdBy" = vote."createdBy"
ON CONFLICT ("feedbackId", "userKey") DO UPDATE SET
  "value" = EXCLUDED."value",
  "updatedAt" = CURRENT_TIMESTAMP;

COMMIT;
