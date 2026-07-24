-- CreateTable
CREATE TABLE "RoadmapInstance" (
    "id" SERIAL NOT NULL,
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
    "spHealthCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoadmapInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoadmapInstanceHost" (
    "id" SERIAL NOT NULL,
    "host" TEXT NOT NULL,
    "instanceId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoadmapInstanceHost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuperAdmin" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "normalizedUsername" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SuperAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstanceDepartmentAccess" (
    "id" SERIAL NOT NULL,
    "instanceSlug" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "normalizedDepartment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstanceDepartmentAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackRequest" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedbackRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackVote" (
    "id" SERIAL NOT NULL,
    "feedbackId" INTEGER NOT NULL,
    "userKey" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedbackVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportConversation" (
    "id" TEXT NOT NULL,
    "visitorTokenHash" TEXT NOT NULL,
    "visitorName" TEXT,
    "visitorUserKey" TEXT,
    "instanceSlug" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "supportLastReadAt" TIMESTAMP(3),
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportMessage" (
    "id" SERIAL NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderRole" TEXT NOT NULL,
    "senderName" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitBucket" (
    "scope" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "resetAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("scope","keyHash")
);

-- CreateTable
CREATE TABLE "AuthSession" (
    "id" TEXT NOT NULL,
    "userKey" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RoadmapInstance_slug_key" ON "RoadmapInstance"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "RoadmapInstance_landingPage_key" ON "RoadmapInstance"("landingPage");

-- CreateIndex
CREATE UNIQUE INDEX "RoadmapInstanceHost_host_key" ON "RoadmapInstanceHost"("host");

-- CreateIndex
CREATE UNIQUE INDEX "SuperAdmin_normalizedUsername_key" ON "SuperAdmin"("normalizedUsername");

-- CreateIndex
CREATE INDEX "InstanceDepartmentAccess_instanceSlug_idx" ON "InstanceDepartmentAccess"("instanceSlug");

-- CreateIndex
CREATE UNIQUE INDEX "InstanceDepartmentAccess_instanceSlug_normalizedDepartment_key" ON "InstanceDepartmentAccess"("instanceSlug", "normalizedDepartment");

-- CreateIndex
CREATE INDEX "FeedbackRequest_createdAt_idx" ON "FeedbackRequest"("createdAt");

-- CreateIndex
CREATE INDEX "FeedbackVote_userKey_idx" ON "FeedbackVote"("userKey");

-- CreateIndex
CREATE UNIQUE INDEX "FeedbackVote_feedbackId_userKey_key" ON "FeedbackVote"("feedbackId", "userKey");

-- CreateIndex
CREATE UNIQUE INDEX "SupportConversation_visitorTokenHash_key" ON "SupportConversation"("visitorTokenHash");

-- CreateIndex
CREATE INDEX "SupportConversation_status_lastMessageAt_idx" ON "SupportConversation"("status", "lastMessageAt");

-- CreateIndex
CREATE INDEX "SupportConversation_instanceSlug_lastMessageAt_idx" ON "SupportConversation"("instanceSlug", "lastMessageAt");

-- CreateIndex
CREATE INDEX "SupportMessage_conversationId_createdAt_idx" ON "SupportMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "RateLimitBucket_resetAt_idx" ON "RateLimitBucket"("resetAt");

-- CreateIndex
CREATE INDEX "AuthSession_expiresAt_idx" ON "AuthSession"("expiresAt");

-- CreateIndex
CREATE INDEX "AuthSession_userKey_revokedAt_idx" ON "AuthSession"("userKey", "revokedAt");

-- AddForeignKey
ALTER TABLE "RoadmapInstanceHost" ADD CONSTRAINT "RoadmapInstanceHost_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "RoadmapInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackVote" ADD CONSTRAINT "FeedbackVote_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "FeedbackRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "SupportConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
