-- CreateEnum
CREATE TYPE "VisitOutcome" AS ENUM ('PENDING', 'DONE', 'NO_SHOW', 'CANCELLED');

-- CreateTable
CREATE TABLE "VisitSlot" (
    "id" UUID NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "volunteerId" UUID NOT NULL,
    "isCancelled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visit" (
    "id" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "slotId" UUID NOT NULL,
    "outcome" "VisitOutcome" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VisitSlot_startsAt_idx" ON "VisitSlot"("startsAt");

-- CreateIndex
CREATE INDEX "VisitSlot_volunteerId_startsAt_idx" ON "VisitSlot"("volunteerId", "startsAt");

-- CreateIndex
CREATE INDEX "Visit_applicationId_idx" ON "Visit"("applicationId");

-- CreateIndex
CREATE INDEX "Visit_slotId_idx" ON "Visit"("slotId");

-- AddForeignKey
ALTER TABLE "VisitSlot" ADD CONSTRAINT "VisitSlot_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "VisitSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Termin ni dvakrat rezerviran (US-05 AC 3, 5): največ en neodpovedan ogled na termin.
-- Ob sočasni rezervaciji istega termina ta indeks zavrne drugo (docs/03).
CREATE UNIQUE INDEX "visit_one_active_per_slot" ON "Visit" ("slotId") WHERE "outcome" <> 'CANCELLED';

-- Vloga ima največ en dogovorjen (še neizveden) ogled.
CREATE UNIQUE INDEX "visit_one_pending_per_application" ON "Visit" ("applicationId") WHERE "outcome" = 'PENDING';

-- Termin se konča po začetku.
ALTER TABLE "VisitSlot" ADD CONSTRAINT "visit_slot_valid_range" CHECK ("endsAt" > "startsAt");
