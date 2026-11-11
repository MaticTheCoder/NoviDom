"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { completeAdoptionAction } from "../actions";

/**
 * »Zaključi posvojitev« s potrditvenim oknom (US-07 AC 1, 2). Okno pove, koliko ostalih
 * aktivnih vlog za to žival bo samodejno zavrnjenih. Uporablja izvorni <dialog> (fokus,
 * tipka Esc in zaklep ozadja ureja brskalnik).
 */
export function AdoptionDialog({
  applicationId,
  animalName,
  adopterName,
  otherActiveCount,
}: {
  applicationId: string;
  animalName: string;
  adopterName: string;
  otherActiveCount: number;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  const confirm = () => {
    setError(undefined);
    startTransition(async () => {
      const res = await completeAdoptionAction(applicationId);
      if (res.ok) dialog.current?.close();
      else setError(res.error);
    });
  };

  return (
    <>
      <Button type="button" onClick={() => dialog.current?.showModal()}>
        Zaključi posvojitev
      </Button>
      <dialog
        ref={dialog}
        aria-labelledby="adoption-title"
        aria-describedby="adoption-desc"
        className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-xl border bg-background p-0 text-foreground shadow-xl backdrop:bg-black/40"
      >
        <div className="flex flex-col gap-4 p-6">
          <h2 id="adoption-title" className="text-lg font-semibold">
            Zaključi posvojitev
          </h2>
          <div id="adoption-desc" className="flex flex-col gap-2 text-sm">
            <p>
              Žival <strong>{animalName}</strong> bo predana kandidatu <strong>{adopterName}</strong>. Vloga in žival dobita
              status »posvojena«.
            </p>
            {otherActiveCount > 0 ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                Ostale aktivne vloge za to žival, ki bodo samodejno zavrnjene z razlogom »Žival je posvojena«:{" "}
                <strong data-testid="other-active-count">{otherActiveCount}</strong>
              </p>
            ) : (
              <p className="text-muted-foreground">Za to žival ni drugih aktivnih vlog.</p>
            )}
            <p className="text-muted-foreground">Dejanja ni mogoče razveljaviti.</p>
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" disabled={pending} onClick={() => dialog.current?.close()}>
              Prekliči
            </Button>
            <Button type="button" disabled={pending} onClick={confirm}>
              {pending ? "Zaključevanje …" : "Potrdi posvojitev"}
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
}
