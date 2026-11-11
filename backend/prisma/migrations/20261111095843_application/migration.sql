-- CreateEnum
CREATE TYPE "HousingType" AS ENUM ('APARTMENT', 'HOUSE');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('SUBMITTED', 'IN_REVIEW', 'VISIT_SCHEDULED', 'VISIT_DONE', 'APPROVED', 'REJECTED', 'WITHDRAWN', 'ADOPTED');

-- CreateEnum
CREATE TYPE "MatchLevel" AS ENUM ('MATCH', 'CONDITIONAL', 'MISMATCH');

-- CreateTable
CREATE TABLE "Household" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "housingType" "HousingType" NOT NULL,
    "hasGarden" BOOLEAN NOT NULL,
    "childrenAges" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "hasDogs" BOOLEAN NOT NULL DEFAULT false,
    "hasCats" BOOLEAN NOT NULL DEFAULT false,
    "hoursAlonePerDay" INTEGER NOT NULL,
    "experience" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Household_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" UUID NOT NULL,
    "adopterId" UUID NOT NULL,
    "animalId" UUID NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "motivation" TEXT NOT NULL,
    "householdSnapshot" JSONB NOT NULL,
    "matchLevel" "MatchLevel" NOT NULL,
    "matchWarnings" JSONB NOT NULL DEFAULT '[]',
    "decisionComment" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Household_userId_key" ON "Household"("userId");

-- CreateIndex
CREATE INDEX "Application_adopterId_status_idx" ON "Application"("adopterId", "status");

-- CreateIndex
CREATE INDEX "Application_animalId_status_idx" ON "Application"("animalId", "status");

-- AddForeignKey
ALTER TABLE "Household" ADD CONSTRAINT "Household_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_adopterId_fkey" FOREIGN KEY ("adopterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Delna unikatna indeksa (docs/03-podatkovni-model.md, »Omejitve in pravila na ravni baze«).
-- Prisma shema delnih indeksov ne izrazi, zato sta dodana ročno.

-- Ena aktivna vloga posvojitelja za isto žival (US-02 AC 3).
CREATE UNIQUE INDEX "application_one_active_per_adopter_animal"
  ON "Application" ("adopterId", "animalId")
  WHERE "status" IN ('SUBMITTED', 'IN_REVIEW', 'VISIT_SCHEDULED', 'VISIT_DONE', 'APPROVED');

-- Največ ena odobrena vloga na žival (US-04 AC 3).
CREATE UNIQUE INDEX "application_one_approved_per_animal"
  ON "Application" ("animalId")
  WHERE "status" = 'APPROVED';
