PRAGMA foreign_keys=OFF;

CREATE TABLE "new_RoadmapInstance" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "department" TEXT,
    "description" TEXT,
    "sharePointSiteUrlDev" TEXT NOT NULL,
    "sharePointSiteUrlProd" TEXT,
    "sharePointStrategy" TEXT NOT NULL DEFAULT 'kerberos',
    "allowSelfSigned" BOOLEAN NOT NULL DEFAULT false,
    "trustedCaPath" TEXT,
    "deploymentEnv" TEXT,
    "defaultLocale" TEXT,
    "defaultTimeZone" TEXT,
    "landingPage" TEXT,
    "settingsJson" TEXT,
    "spHealthJson" TEXT,
    "spHealthCheckedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "new_RoadmapInstance" (
    "allowSelfSigned",
    "createdAt",
    "defaultLocale",
    "defaultTimeZone",
    "department",
    "deploymentEnv",
    "description",
    "displayName",
    "id",
    "landingPage",
    "settingsJson",
    "sharePointSiteUrlDev",
    "sharePointSiteUrlProd",
    "sharePointStrategy",
    "slug",
    "spHealthCheckedAt",
    "spHealthJson",
    "trustedCaPath",
    "updatedAt"
)
SELECT
    "allowSelfSigned",
    "createdAt",
    "defaultLocale",
    "defaultTimeZone",
    "department",
    "deploymentEnv",
    "description",
    "displayName",
    "id",
    "landingPage",
    "settingsJson",
    "sharePointSiteUrlDev",
    "sharePointSiteUrlProd",
    "sharePointStrategy",
    "slug",
    "spHealthCheckedAt",
    "spHealthJson",
    "trustedCaPath",
    "updatedAt"
FROM "RoadmapInstance";

DROP TABLE "RoadmapInstance";
ALTER TABLE "new_RoadmapInstance" RENAME TO "RoadmapInstance";
CREATE UNIQUE INDEX "RoadmapInstance_slug_key" ON "RoadmapInstance"("slug");
CREATE UNIQUE INDEX "RoadmapInstance_landingPage_key" ON "RoadmapInstance"("landingPage");

PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
