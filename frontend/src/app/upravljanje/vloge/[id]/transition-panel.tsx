"use client";

import type { TransitionDefinition } from "@novi-dom/backend/state-machine";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { transitionAction } from "../actions";

const VARIANT: Partial<Record<string, "default" | "outline" | "destructive">> = {
  REJECTED: "destructive",
  APPROVED: "default",
  IN_REVIEW: "default",
};

/**
 * Gumbi za prehode, dovoljene vodji iz trenutnega stanja (US-04 AC 1). Prehodi z obveznim
 * komentarjem (zavrnitev, umik odobritve) najprej odprejo polje za komentar (AC 4).
 */
export function TransitionPanel({
  applicationId,
  actions,
  otherApproved,
  hasAdoption = false,
}: {
  applicationId: string;
  actions: TransitionDefinition[];
  otherApproved: { id: string; adopter: { name: string } } | null;
  hasAdoption?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState<TransitionDefinition | null>(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<{ message: string; field?: string }>();

  const run = (t: TransitionDefinition, text?: string) => {
    setError(undefined);
    startTransition(async () => {
      const res = await transitionAction(applicationId, t.to, text);
      if (res.ok) {
        setOpen(null);
        setComment("");
      } else setError({ message: res.error, field: res.fieldErrors?.comment });
    });
  };

  if (actions.length === 0 && !hasAdoption) return <p className="text-sm text-muted-foreground">Iz tega stanja vodja nima razpoložljivih dejanj.</p>;

  const min = open?.minCommentLength ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {actions.map((t) => {
          const blocked = t.to === "APPROVED" && !!otherApproved;
          return (
            <Button
              key={`${t.from}-${t.to}`}
              type="button"
              variant={VARIANT[t.to] ?? "outline"}
              disabled={pending || blocked}
              onClick={() => {
                setError(undefined);
                if (t.minCommentLength) setOpen(t);
                else run(t);
              }}
            >
              {t.label}
            </Button>
          );
        })}
      </div>

      {otherApproved && actions.some((t) => t.to === "APPROVED") && (
        <p className="text-sm text-destructive">
          Za to žival je že odobrena vloga kandidata {otherApproved.adopter.name}.{" "}
          <Link href={`/upravljanje/vloge/${otherApproved.id}`} className="underline">
            Odpri odobreno vlogo
          </Link>
        </p>
      )}

      {open && (
        <form
          className="flex flex-col gap-3 rounded-xl border p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (comment.trim().length < min) {
              setError({ message: "", field: `Vnesite komentar z vsaj ${min} znaki.` });
              return;
            }
            run(open, comment);
          }}
        >
          <Label htmlFor="transition-comment">{open.label}: utemeljitev (vidi jo tudi kandidat)</Label>
          <Textarea
            id="transition-comment"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            aria-invalid={!!error?.field}
            aria-describedby="transition-comment-hint"
          />
          <p id="transition-comment-hint" className={error?.field ? "text-sm text-destructive" : "text-xs text-muted-foreground"}>
            {error?.field ?? `Vsaj ${min} znakov (trenutno ${comment.trim().length}).`}
          </p>
          <div className="flex gap-2">
            <Button type="submit" variant={VARIANT[open.to] ?? "default"} disabled={pending}>
              {pending ? "Shranjevanje …" : `Potrdi: ${open.label}`}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(null)}>
              Prekliči
            </Button>
          </div>
        </form>
      )}

      {error?.message && !error.field && (
        <p role="alert" className="text-sm text-destructive">
          {error.message}
        </p>
      )}
    </div>
  );
}
