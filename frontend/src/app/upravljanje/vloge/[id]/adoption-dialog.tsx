"use client";

import { useRef, useState, useTransition } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { completeAdoptionAction } from "../actions";

/**
 * »1 ostala aktivna vloga … bo zavrnjena«, »2 ostali aktivni vlogi … bosta zavrnjeni«,
 * »3 ostale aktivne vloge … bodo zavrnjene«, »5 ostalih aktivnih vlog … bo zavrnjenih«.
 */
function rejectionParts(n: number) {
  const m = n % 100;
  if (m === 1) return { subject: `${n} ostala aktivna vloga`, verb: "bo samodejno zavrnjena" };
  if (m === 2) return { subject: `${n} ostali aktivni vlogi`, verb: "bosta samodejno zavrnjeni" };
  if (m === 3 || m === 4) return { subject: `${n} ostale aktivne vloge`, verb: "bodo samodejno zavrnjene" };
  return { subject: `${n} ostalih aktivnih vlog`, verb: "bo samodejno zavrnjenih" };
}

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
      <Button type="button" size="lg" onClick={() => dialog.current?.showModal()}>
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
            Zaključi posvojitev: {animalName}
          </h2>
          <div id="adoption-desc" className="flex flex-col gap-2 text-sm">
            <p>
              Žival {animalName} bo predana kandidatu {adopterName}. Vloga in žival bosta označeni kot <strong>posvojeni</strong>.
            </p>
            {otherActiveCount > 0 ? (
              <p className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
                <span>
                  <strong data-testid="other-active-count">{rejectionParts(otherActiveCount).subject}</strong> za to žival{" "}
                  {rejectionParts(otherActiveCount).verb} z razlogom »Žival je posvojena«.
                </span>
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
              {pending ? "Zaključevanje …" : "Potrdi zaključek"}
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
}
