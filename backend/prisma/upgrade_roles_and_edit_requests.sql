BEGIN;

CREATE TYPE "UserRole_new" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'APPLICANT');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User"
  ALTER COLUMN "role" TYPE "UserRole_new"
  USING (
    CASE "role"::text
      WHEN 'ADMIN_1' THEN 'ADMIN'
      WHEN 'ADMIN_2' THEN 'SUPER_ADMIN'
      WHEN 'ADMIN' THEN 'SUPER_ADMIN'
      ELSE "role"::text
    END
  )::"UserRole_new";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'EMPLOYEE';
DROP TYPE "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";

CREATE TYPE "EditRequestStatus_new" AS ENUM ('NONE', 'PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');
ALTER TABLE "Registration" ALTER COLUMN "editRequestStatus" DROP DEFAULT;
ALTER TABLE "Registration"
  ALTER COLUMN "editRequestStatus" TYPE "EditRequestStatus_new"
  USING (
    CASE "editRequestStatus"::text
      WHEN 'PENDING_ADMIN_1' THEN 'PENDING'
      WHEN 'PENDING_ADMIN_2' THEN 'PENDING'
      ELSE "editRequestStatus"::text
    END
  )::"EditRequestStatus_new";
ALTER TABLE "Registration" ALTER COLUMN "editRequestStatus" SET DEFAULT 'NONE';
DROP TYPE "EditRequestStatus";
ALTER TYPE "EditRequestStatus_new" RENAME TO "EditRequestStatus";

ALTER TABLE "Registration"
  ADD COLUMN "editApprovedById" INTEGER,
  ADD COLUMN "editApprovedByName" TEXT,
  ADD COLUMN "editApprovedAt" TIMESTAMP(3),
  ADD COLUMN "editRejectedById" INTEGER,
  ADD COLUMN "editRejectedByName" TEXT,
  ADD COLUMN "editRejectedAt" TIMESTAMP(3);

UPDATE "Registration"
SET
  "editApprovedByName" = CASE
    WHEN "editRequestStatus" IN ('APPROVED', 'COMPLETED')
      THEN COALESCE("editRequestAdmin2ApprovedByName", "editRequestAdmin1ApprovedByName")
    ELSE NULL
  END,
  "editApprovedAt" = CASE
    WHEN "editRequestStatus" IN ('APPROVED', 'COMPLETED')
      THEN COALESCE("editRequestAdmin2ApprovedAt", "editRequestAdmin1ApprovedAt")
    ELSE NULL
  END,
  "editRejectedByName" = "editRequestRejectedByName",
  "editRejectedAt" = "editRequestRejectedAt";

ALTER TABLE "Registration"
  DROP COLUMN "editRequestAdmin1ApprovedAt",
  DROP COLUMN "editRequestAdmin1ApprovedByName",
  DROP COLUMN "editRequestAdmin2ApprovedAt",
  DROP COLUMN "editRequestAdmin2ApprovedByName",
  DROP COLUMN "editRequestRejectedAt",
  DROP COLUMN "editRequestRejectedByName";

COMMIT;
