"use client";

import type { AnimalStatus } from "@novi-dom/backend/enums";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { changeAnimalStatusAction } from "./actions";

/**
 * Ročna sprememba statusa živali (US-01 AC 2–5). Vodja lahko preklaplja le med
 * »sprejeta« in »na voljo«; pri rezervirani ali posvojeni živali gumba ni.
 */
export function StatusControl({
  animalId,
  status,
  missing,
}: {
  animalId: string;
  status: AnimalStatus;
  missing: string[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  const change = (target: AnimalStatus) => {
    setError(undefined);
    startTransition(async () => {
      const res = await changeAnimalStatusAction(animalId, target);
      if (!res.ok) setError(res.error);
    });
  };

  if (status === "RESERVED" || status === "ADOPTED") {
    return (
      <p className="text-sm text-muted-foreground">
        Status {status === "RESERVED" ? "»rezervirana«" : "»posvojena«"} se spremeni le prek obravnave vloge.
      </p>
    );
  }

  const canPublish = missing.length === 0;

  return (
    <div className="flex flex-col gap-3">
      {status === "INTAKE" ? (
        <>
          <p className="text-sm text-muted-foreground">
            Žival je »sprejeta« in ni prikazana v javnem katalogu.
          </p>
          <div>
            <Button type="button" disabled={!canPublish || pending} onClick={() => change("AVAILABLE")}>
              {pending ? "Shranjevanje …" : "Označi kot na voljo"}
            </Button>
          </div>
          {!canPublish && (
            <p id="missing-attributes" className="text-sm text-destructive">
              Manjkajoče lastnosti: {missing.join(", ")}. Izpolnite jih v obrazcu spodaj (vrednost »neznano« šteje kot
              izpolnjena).
            </p>
          )}
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">Žival je »na voljo« in je prikazana v javnem katalogu.</p>
          <div>
            <Button type="button" variant="outline" disabled={pending} onClick={() => change("INTAKE")}>
              {pending ? "Shranjevanje …" : "Vrni v »sprejeta«"}
            </Button>
          </div>
        </>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
