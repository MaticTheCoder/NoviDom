-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADOPTER', 'VOLUNTEER', 'MANAGER');

-- CreateEnum
CREATE TYPE "Species" AS ENUM ('DOG', 'CAT');

-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "AnimalSize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE');

-- CreateEnum
CREATE TYPE "EnergyLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "KidsCompatibility" AS ENUM ('YES', 'OVER_6', 'NO', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "Compatibility" AS ENUM ('YES', 'NO', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "AnimalStatus" AS ENUM ('INTAKE', 'AVAILABLE', 'RESERVED', 'ADOPTED');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "Role" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Animal" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "species" "Species" NOT NULL,
    "sex" "Sex" NOT NULL,
    "birthDateApprox" DATE NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "internalNotes" TEXT NOT NULL DEFAULT '',
    "size" "AnimalSize",
    "energyLevel" "EnergyLevel",
    "needsGarden" BOOLEAN,
    "goodWithKids" "KidsCompatibility",
    "goodWithDogs" "Compatibility",
    "goodWithCats" "Compatibility",
    "isChipped" BOOLEAN NOT NULL DEFAULT false,
    "isVaccinated" BOOLEAN NOT NULL DEFAULT false,
    "isNeutered" BOOLEAN NOT NULL DEFAULT false,
    "status" "AnimalStatus" NOT NULL DEFAULT 'INTAKE',
    "intakeDate" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Animal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnimalPhoto" (
    "id" UUID NOT NULL,
    "animalId" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AnimalPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Animal_status_species_idx" ON "Animal"("status", "species");

-- CreateIndex
CREATE INDEX "AnimalPhoto_animalId_sortOrder_idx" ON "AnimalPhoto"("animalId", "sortOrder");

-- AddForeignKey
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnimalPhoto" ADD CONSTRAINT "AnimalPhoto_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
