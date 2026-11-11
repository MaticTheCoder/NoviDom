-- CreateEnum
CREATE TYPE "Recommendation" AS ENUM ('RECOMMEND', 'WITH_RESERVATIONS', 'NOT_RECOMMEND');

-- CreateTable
CREATE TABLE "VisitReport" (
    "id" UUID NOT NULL,
    "visitId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "recommendation" "Recommendation" NOT NULL,
    "text" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VisitReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VisitReport_visitId_key" ON "VisitReport"("visitId");

-- AddForeignKey
ALTER TABLE "VisitReport" ADD CONSTRAINT "VisitReport_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitReport" ADD CONSTRAINT "VisitReport_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
