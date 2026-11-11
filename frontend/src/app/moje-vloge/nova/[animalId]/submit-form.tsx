"use client";

import { ACKNOWLEDGE_WARNINGS_LABEL, MOTIVATION_MIN_LENGTH } from "@novi-dom/backend/validation";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { type SubmitResult, submitApplicationAction } from "./actions";

const NOT_ACKNOWLEDGED = "APPLICATION_WARNINGS_NOT_ACKNOWLEDGED";

/**
 * Obrazec za oddajo. Ob oceni Neujemanje mora posvojitelj označiti »Seznanjen sem z opozorili«
 * (US-03 AC 5); enako preveri tudi strežnik, ki oceno izračuna znova.
 */
export function SubmitForm({ animalId, requireAcknowledgement }: { animalId: string; requireAcknowledgement: boolean }) {
  const [pending, startTransition] = useTransition();
  const [motivation, setMotivation] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [result, setResult] = useState<SubmitResult>();
  const [ackError, setAckError] = useState<string>();

  // Strežnik lahko zahteva potrditev tudi, če se je ocena po odprtju strani spremenila.
  const needsAck = requireAcknowledgement || result?.code === NOT_ACKNOWLEDGED;
  const motivationError = result?.fieldErrors?.motivation;
  const shownAckError = ackError ?? result?.fieldErrors?.acknowledgeWarnings;

  return (
    <form
      className="flex flex-col gap-4"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setResult(undefined);
        if (needsAck && !acknowledged) {
          setAckError("Pred oddajo potrdite, da ste seznanjeni z opozorili.");
          return;
        }
        setAckError(undefined);
        startTransition(async () => setResult(await submitApplicationAction(animalId, motivation, acknowledged)));
      }}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="motivation">Zakaj želite posvojiti to žival?</Label>
        <Textarea
          id="motivation"
          rows={5}
          value={motivation}
          onChange={(e) => setMotivation(e.target.value)}
          aria-invalid={!!motivationError}
          aria-describedby={motivationError ? "motivation-error" : "motivation-hint"}
        />
        {motivationError ? (
          <p id="motivation-error" className="text-sm text-destructive">
            {motivationError}
          </p>
        ) : (
          <p id="motivation-hint" className="text-xs text-muted-foreground">
            Vsaj {MOTIVATION_MIN_LENGTH} znakov. Opišite svoj vsakdan in kako bi žival vključili vanj.
          </p>
        )}
      </div>

      {needsAck && (
        <div className="flex flex-col gap-1 rounded-lg border border-destructive/30 p-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="acknowledge"
              checked={acknowledged}
              onCheckedChange={(c) => {
                setAcknowledged(c === true);
                if (c === true) setAckError(undefined);
              }}
              aria-invalid={!!shownAckError}
              aria-describedby={shownAckError ? "acknowledge-error" : undefined}
            />
            <Label htmlFor="acknowledge">{ACKNOWLEDGE_WARNINGS_LABEL}</Label>
          </div>
          {shownAckError && (
            <p id="acknowledge-error" className="text-sm text-destructive">
              {shownAckError}
            </p>
          )}
        </div>
      )}

      {result && !result.fieldErrors && (
        <p role="alert" className="text-sm text-destructive">
          {result.error}{" "}
          {result.applicationId && (
            <Link href={`/moje-vloge/${result.applicationId}`} className="underline">
              Odpri obstoječo vlogo
            </Link>
          )}
          {result.code === "APPLICATION_TOO_MANY_ACTIVE" && (
            <Link href="/moje-vloge" className="underline">
              Moje vloge
            </Link>
          )}
        </p>
      )}

      <div>
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Oddajanje …" : "Oddaj vlogo"}
        </Button>
      </div>
    </form>
  );
}
