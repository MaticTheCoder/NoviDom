-- CreateTable
CREATE TABLE "ApplicationEvent" (
    "id" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "fromStatus" "ApplicationStatus",
    "toStatus" "ApplicationStatus" NOT NULL,
    "actorId" UUID,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApplicationEvent_applicationId_createdAt_idx" ON "ApplicationEvent"("applicationId", "createdAt");

-- AddForeignKey
ALTER TABLE "ApplicationEvent" ADD CONSTRAINT "ApplicationEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationEvent" ADD CONSTRAINT "ApplicationEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Revizijska sled je samo za vstavljanje (ADR-0007, US-04 AC 5): sprožilec zavrne
-- vsak UPDATE in DELETE, tudi če bi ga poskusila izvesti koda mimo servisnega sloja.
-- TRUNCATE (seed, testi) vrstičnih sprožilcev ne sproži.
CREATE FUNCTION "application_event_immutable"() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'ApplicationEvent je samo za vstavljanje (%).', TG_OP
    USING ERRCODE = 'restrict_violation';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "application_event_no_update_delete"
  BEFORE UPDATE OR DELETE ON "ApplicationEvent"
  FOR EACH ROW EXECUTE FUNCTION "application_event_immutable"();
