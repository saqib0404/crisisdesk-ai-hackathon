-- CreateEnum
CREATE TYPE "ReportLanguage" AS ENUM ('bn', 'en', 'unknown');

-- CreateEnum
CREATE TYPE "ReportCategory" AS ENUM ('medical', 'fire', 'accident', 'crime', 'flood', 'utility', 'public_service', 'infrastructure', 'other');

-- CreateEnum
CREATE TYPE "ReportUrgency" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('pending', 'in_review', 'assigned', 'resolved', 'rejected');

-- CreateEnum
CREATE TYPE "AiStatus" AS ENUM ('pending', 'success', 'failed', 'fallback');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('admin', 'super_admin');

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'admin',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(120),
    "contact" VARCHAR(150),
    "location" TEXT NOT NULL,
    "normalizedLocation" TEXT,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "description" TEXT NOT NULL,
    "normalizedDescription" TEXT,
    "translatedDescription" TEXT,
    "language" "ReportLanguage" NOT NULL DEFAULT 'unknown',
    "category" "ReportCategory" NOT NULL DEFAULT 'other',
    "urgency" "ReportUrgency" NOT NULL DEFAULT 'medium',
    "summary" TEXT,
    "suggestedAction" TEXT,
    "confidence" DOUBLE PRECISION,
    "possibleDuplicate" BOOLEAN NOT NULL DEFAULT false,
    "duplicateScore" DOUBLE PRECISION,
    "matchedReportId" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'pending',
    "requiresManualReview" BOOLEAN NOT NULL DEFAULT false,
    "aiStatus" "AiStatus" NOT NULL DEFAULT 'pending',
    "aiProvider" VARCHAR(80),
    "aiModel" VARCHAR(120),
    "aiMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportStatusHistory" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "previousStatus" "ReportStatus",
    "newStatus" "ReportStatus" NOT NULL,
    "changedById" TEXT,
    "note" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE INDEX "Admin_role_idx" ON "Admin"("role");

-- CreateIndex
CREATE INDEX "Admin_isActive_idx" ON "Admin"("isActive");

-- CreateIndex
CREATE INDEX "Report_category_idx" ON "Report"("category");

-- CreateIndex
CREATE INDEX "Report_urgency_idx" ON "Report"("urgency");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- CreateIndex
CREATE INDEX "Report_language_idx" ON "Report"("language");

-- CreateIndex
CREATE INDEX "Report_createdAt_idx" ON "Report"("createdAt");

-- CreateIndex
CREATE INDEX "Report_matchedReportId_idx" ON "Report"("matchedReportId");

-- CreateIndex
CREATE INDEX "Report_possibleDuplicate_idx" ON "Report"("possibleDuplicate");

-- CreateIndex
CREATE INDEX "Report_requiresManualReview_idx" ON "Report"("requiresManualReview");

-- CreateIndex
CREATE INDEX "Report_category_urgency_idx" ON "Report"("category", "urgency");

-- CreateIndex
CREATE INDEX "Report_status_createdAt_idx" ON "Report"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ReportStatusHistory_reportId_idx" ON "ReportStatusHistory"("reportId");

-- CreateIndex
CREATE INDEX "ReportStatusHistory_changedById_idx" ON "ReportStatusHistory"("changedById");

-- CreateIndex
CREATE INDEX "ReportStatusHistory_newStatus_idx" ON "ReportStatusHistory"("newStatus");

-- CreateIndex
CREATE INDEX "ReportStatusHistory_reportId_changedAt_idx" ON "ReportStatusHistory"("reportId", "changedAt");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_matchedReportId_fkey" FOREIGN KEY ("matchedReportId") REFERENCES "Report"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportStatusHistory" ADD CONSTRAINT "ReportStatusHistory_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportStatusHistory" ADD CONSTRAINT "ReportStatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
