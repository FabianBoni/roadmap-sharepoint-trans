-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "entityLabel" TEXT,
    "actorKey" TEXT NOT NULL,
    "actorDisplayName" TEXT,
    "actorSource" TEXT,
    "instanceSlug" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'instance',
    "requestMethod" TEXT NOT NULL,
    "requestPath" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditEvent_occurredAt_idx" ON "AuditEvent"("occurredAt");

-- CreateIndex
CREATE INDEX "AuditEvent_instanceSlug_occurredAt_idx" ON "AuditEvent"("instanceSlug", "occurredAt");

-- CreateIndex
CREATE INDEX "AuditEvent_visibility_occurredAt_idx" ON "AuditEvent"("visibility", "occurredAt");

-- CreateIndex
CREATE INDEX "AuditEvent_actorKey_occurredAt_idx" ON "AuditEvent"("actorKey", "occurredAt");
