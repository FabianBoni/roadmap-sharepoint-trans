-- AlterTable
ALTER TABLE "FeedbackRequest"
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'OPEN',
ADD COLUMN "completedAt" TIMESTAMP(3),
ADD COLUMN "completedBy" TEXT;

-- CreateIndex
CREATE INDEX "FeedbackRequest_status_completedAt_idx"
ON "FeedbackRequest"("status", "completedAt");
