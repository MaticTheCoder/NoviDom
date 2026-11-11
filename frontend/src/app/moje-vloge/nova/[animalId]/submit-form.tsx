"use client";

import { MOTIVATION_MIN_LENGTH } from "@novi-dom/backend/validation";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { type SubmitResult, submitApplicationAction } from "./actions";

export function SubmitForm({ animalId }: { animalId: string }) {
  const [pending, startTransition] = useTransition();
  const [motivation, setMotivation] = useState("");
  const [result, setResult] = useState<SubmitResult>();
  const fieldError = result?.fieldErrors?.motivation;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        setResult(undefined);
        startTransition(async () => setResult(await submitApplicationAction(animalId, motivation)));
      }}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="motivation">Zakaj želite posvojiti to žival?</Label>
        <Textarea
          id="motivation"
          rows={5}
          value={motivation}
          onChange={(e) => setMotivation(e.target.value)}
          aria-invalid={!!fieldError}
          aria-describedby={fieldError ? "motivation-error" : "motivation-hint"}
        />
        {fieldError ? (
          <p id="motivation-error" className="text-sm text-destructive">
            {fieldError}
          </p>
        ) : (
          <p id="motivation-hint" className="text-xs text-muted-foreground">
            Vsaj {MOTIVATION_MIN_LENGTH} znakov. Opišite svoj vsakdan in kako bi žival vključili vanj.
          </p>
        )}
      </div>

      {result && !fieldError && (
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
