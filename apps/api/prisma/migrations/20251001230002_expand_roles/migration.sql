-- SAFE enum migration for Postgres: rebuild enum, remap, drop old

-- 1) Rename old enum
ALTER TYPE "Role" RENAME TO "Role_old";

-- 2) Create the new enum with all target values
CREATE TYPE "Role" AS ENUM (
  'SUPER_ADMIN',
  'SCHOOL_ADMIN',
  'OPERATIONS_MANAGER',
  'BRANCH_MANAGER',
  'ADMISSIONS_OFFICER',
  'FINANCE_MANAGER',
  'FINANCE_OFFICER',
  'TEACHER',
  'TEACHING_ASSISTANT',
  'TRAINER',
  'TRAINEE',
  'SUPPORT_STAFF',
  'PARENT_GUARDIAN',
  'STUDENT'
);

-- 3) Temporarily cast column to text so we can remap values
ALTER TABLE "User" ALTER COLUMN "role" TYPE text USING "role"::text;

-- 4) Remap legacy values to the new names (if any exist)
UPDATE "User" SET "role" = 'BRANCH_MANAGER'     WHERE "role" = 'BRANCH_ADMIN';
UPDATE "User" SET "role" = 'ADMISSIONS_OFFICER' WHERE "role" = 'ADMISSIONS';
UPDATE "User" SET "role" = 'PARENT_GUARDIAN'    WHERE "role" = 'PARENT';
UPDATE "User" SET "role" = 'FINANCE_MANAGER'    WHERE "role" = 'FINANCE';

-- 5) Cast column back to the NEW enum
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role" USING "role"::"Role";

-- 6) Drop the old enum
DROP TYPE "Role_old";
