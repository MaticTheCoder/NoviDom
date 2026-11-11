"use client";

import type { Recommendation } from "@novi-dom/backend/enums";
import { REPORT_MIN_LENGTH, visitReportSchema } from "@novi-dom/backend/validation/visit";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RECOMMENDATION_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { saveReportAction } from "../actions";

/** Obrazec zapisnika (US-06 AC 2). Večji gumbi za priporočilo, ker prostovoljec piše na telefonu. */
export function ReportForm({
  visitId,
  mode,
  initial,
}: {
  visitId: string;
  mode: "submit" | "update";
  initial?: { recommendation: Recommendation; text: string };
}) {
  const [recommendation, setRecommendation] = useState<Recommendation | undefined>(initial?.recommendation);
  const [text, setText] = useState(initial?.text ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ error?: string; saved?: boolean }>({});
  const [pending, startTransition] = useTransition();
  // Napaka pri polju izgine, ko ga uporabnik popravi.
  const clearError = (field: string) =>
    setErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({});
    const parsed = visitReportSchema.safeParse({ visitId, recommendation, text });
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path.join("."), i.message])));
      return;
    }
    setErrors({});
    startTransition(async () => {
      const res = await saveReportAction(mode, parsed.data);
      if (res.ok) setMessage({ saved: true });
      else {
        setErrors(res.fieldErrors ?? {});
        setMessage({ error: res.error });
      }
    });
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2" aria-describedby={errors.recommendation ? "rec-error" : undefined}>
        <legend className="mb-2 text-sm font-medium">Priporočilo</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {(Object.keys(RECOMMENDATION_LABEL) as Recommendation[]).map((value) => (
            <label
              key={value}
              className={cn(
                "flex min-h-11 cursor-pointer items-center justify-center rounded-lg border px-3 text-sm font-medium has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
                recommendation === value ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
            >
              <input
                type="radio"
                name="recommendation"
                value={value}
                checked={recommendation === value}
                onChange={() => {
                  setRecommendation(value);
                  clearError("recommendation");
                }}
                className="sr-only"
              />
              {RECOMMENDATION_LABEL[value]}
            </label>
          ))}
        </div>
        {errors.recommendation && (
          <p id="rec-error" className="text-sm text-destructive">
            {errors.recommendation}
          </p>
        )}
      </fieldset>

      <div className="flex flex-col gap-2">
        <Label htmlFor="report-text">Zapisnik</Label>
        <Textarea
          id="report-text"
          rows={6}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            clearError("text");
          }}
          placeholder="Kako je potekal stik kandidata z živaljo? Kaj ste opazili?"
          aria-invalid={!!errors.text}
          aria-describedby="report-text-hint"
        />
        <p id="report-text-hint" className={errors.text ? "text-sm text-destructive" : "text-xs text-muted-foreground"}>
          {errors.text ?? `Vsaj ${REPORT_MIN_LENGTH} znakov (trenutno ${text.trim().length}).`}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="lg" className="min-h-11 w-full sm:w-auto" disabled={pending}>
          {pending ? "Shranjevanje …" : mode === "submit" ? "Oddaj zapisnik" : "Shrani spremembe"}
        </Button>
        <p role="status" className="text-sm">
          {message.error && <span className="text-destructive">{message.error}</span>}
          {message.saved && <span className="text-muted-foreground">Zapisnik je shranjen.</span>}
        </p>
      </div>
    </form>
  );
}
