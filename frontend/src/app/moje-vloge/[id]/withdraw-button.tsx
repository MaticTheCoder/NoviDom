"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { withdrawApplicationAction } from "../actions";

export function WithdrawButton({ applicationId, animalName }: { applicationId: string; animalName: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  return (
    <div className="flex flex-col gap-2">
      <div>
        <Button
          type="button"
          variant="destructive"
          disabled={pending}
          onClick={() => {
            if (!confirm(`Ali res želite umakniti vlogo za žival ${animalName}? Umika ni mogoče preklicati.`)) return;
            setError(undefined);
            startTransition(async () => {
              const res = await withdrawApplicationAction(applicationId);
              if (!res.ok) setError(res.error);
            });
          }}
        >
          {pending ? "Umikanje …" : "Umakni vlogo"}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
