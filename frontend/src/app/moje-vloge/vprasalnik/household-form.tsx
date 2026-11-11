"use client";

import { type HouseholdInput, householdInputSchema, MAX_CHILDREN } from "@novi-dom/backend/validation/household";
import { useState, useTransition } from "react";
import { Controller, type FieldPath, useFieldArray, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { HOUSING_LABEL } from "@/lib/labels";
import { saveHouseholdAction } from "./actions";

/** Vrednosti obrazca: številska polja so nizi, da je lahko polje med vnosom prazno. */
type FormValues = {
  housingType: string;
  hasGarden: string; // "", "true", "false"
  children: { age: string }[];
  hasDogs: boolean;
  hasCats: boolean;
  hoursAlonePerDay: string;
  experience: string;
};

function toFormValues(h: HouseholdInput | null): FormValues {
  return {
    housingType: h?.housingType ?? "",
    hasGarden: h ? String(h.hasGarden) : "",
    children: (h?.childrenAges ?? []).map((age) => ({ age: String(age) })),
    hasDogs: h?.hasDogs ?? false,
    hasCats: h?.hasCats ?? false,
    hoursAlonePerDay: h ? String(h.hoursAlonePerDay) : "",
    experience: h?.experience ?? "",
  };
}

const num = (v: string) => (v.trim() === "" ? undefined : Number(v));

function toInput(v: FormValues) {
  return {
    housingType: v.housingType || undefined,
    hasGarden: v.hasGarden === "" ? undefined : v.hasGarden === "true",
    childrenAges: v.children.map((c) => num(c.age)),
    hasDogs: v.hasDogs,
    hasCats: v.hasCats,
    hoursAlonePerDay: num(v.hoursAlonePerDay),
    experience: v.experience,
  };
}

/** Pot napake v shemi (childrenAges.0) → polje obrazca (children.0.age). */
const toFormPath = (path: string) => path.replace(/^childrenAges\.(\d+)$/, "children.$1.age") as FieldPath<FormValues>;

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} className="text-sm text-destructive">
      {message}
    </p>
  ) : null;
}

export function HouseholdForm({ household, next }: { household: HouseholdInput | null; next?: string }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ error?: string; saved?: boolean }>({});
  const { register, control, handleSubmit, setError, clearErrors, reset, formState } = useForm<FormValues>({ defaultValues: toFormValues(household) });
  const { errors, isDirty } = formState;
  const children = useFieldArray({ control, name: "children" });

  const submit = handleSubmit((values) => {
    setResult({});
    clearErrors();
    const input = toInput(values);
    const parsed = householdInputSchema.safeParse(input);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) setError(toFormPath(issue.path.join(".")), { message: issue.message });
      return;
    }
    startTransition(async () => {
      const res = await saveHouseholdAction(parsed.data, next);
      if (res.ok) {
        reset(values);
        setResult({ saved: true });
        return;
      }
      for (const [field, message] of Object.entries(res.fieldErrors ?? {})) setError(toFormPath(field), { message });
      setResult({ error: res.error });
    });
  });

  const invalid = (name: string, message?: string) => ({
    "aria-invalid": !!message,
    "aria-describedby": message ? `${name}-error` : undefined,
  });

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-4 rounded-xl border p-4 sm:p-6">
        <legend className="px-1 text-base font-medium">Bivanje</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="h-housingType">Tip bivanja</Label>
            <NativeSelect id="h-housingType" className="w-full" {...register("housingType")} {...invalid("h-housingType", errors.housingType?.message)}>
              <NativeSelectOption value="">Izberite …</NativeSelectOption>
              {Object.entries(HOUSING_LABEL).map(([v, l]) => (
                <NativeSelectOption key={v} value={v}>
                  {l}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <FieldError id="h-housingType-error" message={errors.housingType?.message} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="h-hasGarden">Vrt</Label>
            <NativeSelect id="h-hasGarden" className="w-full" {...register("hasGarden")} {...invalid("h-hasGarden", errors.hasGarden?.message)}>
              <NativeSelectOption value="">Izberite …</NativeSelectOption>
              <NativeSelectOption value="true">imam vrt</NativeSelectOption>
              <NativeSelectOption value="false">nimam vrta</NativeSelectOption>
            </NativeSelect>
            <FieldError id="h-hasGarden-error" message={errors.hasGarden?.message} />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="h-hoursAlonePerDay">Koliko ur na dan bi bila žival sama?</Label>
            <Input
              id="h-hoursAlonePerDay"
              type="number"
              inputMode="numeric"
              min={0}
              max={24}
              className="sm:w-40"
              {...register("hoursAlonePerDay")}
              {...invalid("h-hoursAlonePerDay", errors.hoursAlonePerDay?.message)}
            />
            <FieldError id="h-hoursAlonePerDay-error" message={errors.hoursAlonePerDay?.message} />
          </div>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4 rounded-xl border p-4 sm:p-6">
        <legend className="px-1 text-base font-medium">Otroci v gospodinjstvu</legend>
        <p className="-mt-2 text-sm text-muted-foreground">Vnesite starost vsakega otroka, mlajšega od 18 let. Če otrok nimate, pustite prazno.</p>
        {children.fields.length > 0 && (
          <ul className="flex flex-col gap-3">
            {children.fields.map((field, i) => {
              const message = errors.children?.[i]?.age?.message;
              return (
                <li key={field.id} className="flex flex-col gap-1">
                  <div className="flex items-end gap-2">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor={`h-child-${i}`}>Starost {i + 1}. otroka (leta)</Label>
                      <Input
                        id={`h-child-${i}`}
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={17}
                        className="w-32"
                        {...register(`children.${i}.age`)}
                        {...invalid(`h-child-${i}`, message)}
                      />
                    </div>
                    <Button type="button" variant="ghost" onClick={() => children.remove(i)}>
                      Odstrani
                    </Button>
                  </div>
                  <FieldError id={`h-child-${i}-error`} message={message} />
                </li>
              );
            })}
          </ul>
        )}
        <div>
          <Button type="button" variant="outline" disabled={children.fields.length >= MAX_CHILDREN} onClick={() => children.append({ age: "" })}>
            Dodaj otroka
          </Button>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4 rounded-xl border p-4 sm:p-6">
        <legend className="px-1 text-base font-medium">Druge živali in izkušnje</legend>
        <div className="flex flex-wrap gap-6">
          {(["hasDogs", "hasCats"] as const).map((name) => (
            <Controller
              key={name}
              control={control}
              name={name}
              render={({ field }) => (
                <div className="flex items-center gap-2">
                  <Checkbox id={`h-${name}`} checked={field.value} onCheckedChange={(c) => field.onChange(c === true)} />
                  <Label htmlFor={`h-${name}`} className="font-normal">
                    {name === "hasDogs" ? "V gospodinjstvu imamo psa" : "V gospodinjstvu imamo mačko"}
                  </Label>
                </div>
              )}
            />
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="h-experience">Izkušnje z živalmi (neobvezno)</Label>
          <Textarea id="h-experience" rows={4} {...register("experience")} {...invalid("h-experience", errors.experience?.message)} />
          <FieldError id="h-experience-error" message={errors.experience?.message} />
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Shranjevanje …" : next ? "Shrani in nadaljuj" : "Shrani vprašalnik"}
        </Button>
        <p role="status" className="text-sm">
          {result.error && <span className="text-destructive">{result.error}</span>}
          {result.saved && !isDirty && <span className="text-muted-foreground">Vprašalnik je shranjen.</span>}
        </p>
      </div>
    </form>
  );
}
