BEGIN;

ALTER TYPE "ApplicationStatus"
  RENAME VALUE 'ADMIN_1_APPROVED' TO 'ADMIN_APPROVED';

ALTER TABLE "Registration"
  RENAME COLUMN "admin1ApprovedById" TO "adminApprovedById";
ALTER TABLE "Registration"
  RENAME COLUMN "admin1ApprovedByName" TO "adminApprovedByName";
ALTER TABLE "Registration"
  RENAME COLUMN "admin1ApprovedAt" TO "adminApprovedAt";
ALTER TABLE "Registration"
  RENAME COLUMN "admin2ApprovedById" TO "superAdminApprovedById";
ALTER TABLE "Registration"
  RENAME COLUMN "admin2ApprovedByName" TO "superAdminApprovedByName";
ALTER TABLE "Registration"
  RENAME COLUMN "admin2ApprovedAt" TO "superAdminApprovedAt";

COMMIT;
