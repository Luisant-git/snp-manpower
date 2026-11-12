DO $$
BEGIN
  CREATE TYPE "JobApprovalStatus" AS ENUM ('PENDING', 'ADMIN_APPROVED', 'APPROVED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "JobApproval" (
  "id" SERIAL NOT NULL,
  "externalJobId" TEXT NOT NULL,
  "jobSnapshot" JSONB NOT NULL,
  "status" "JobApprovalStatus" NOT NULL DEFAULT 'PENDING',
  "adminApprovedById" INTEGER,
  "adminApprovedByName" TEXT,
  "adminApprovedAt" TIMESTAMP(3),
  "superAdminApprovedById" INTEGER,
  "superAdminApprovedByName" TEXT,
  "superAdminApprovedAt" TIMESTAMP(3),
  "rejectedById" INTEGER,
  "rejectedByName" TEXT,
  "rejectedAt" TIMESTAMP(3),
  "rejectionReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "JobApproval_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "JobApproval_externalJobId_key"
  ON "JobApproval"("externalJobId");

CREATE INDEX IF NOT EXISTS "JobApproval_status_superAdminApprovedAt_idx"
  ON "JobApproval"("status", "superAdminApprovedAt");
