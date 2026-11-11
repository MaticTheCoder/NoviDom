"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type AnimalInput, animalInputSchema } from "@novi-dom/backend/validation";
import { useState, useTransition } from "react";
import { type Control, Controller, type FieldPath, useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/lib/action-result";
import {
  COMPATIBILITY_LABEL,
  ENERGY_LABEL,
  KIDS_LABEL,
  SEX_LABEL,
  SIZE_LABEL,
  SPECIES_LABEL,
} from "@/lib/labels";

type FormInput = z.input<typeof animalInputSchema>;

export const EMPTY_ANIMAL: FormInput = {
  name: "",
  species: "" as FormInput["species"],
  sex: "" as FormInput["sex"],
  birthDateApprox: "",
  intakeDate: new Date().toISOString().slice(0, 10),
  description: "",
  internalNotes: "",
  size: null,
  energyLevel: null,
  needsGarden: null,
  goodWithKids: null,
  goodWithDogs: null,
  goodWithCats: null,
  isChipped: false,
  isVaccinated: false,
  isNeutered: false,
};

type Option = { value: string; label: string };
const options = (labels: Record<string, string>): Option[] =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));
const GARDEN_OPTIONS: Option[] = [
  { value: "true", label: "da" },
  { value: "false", label: "ne" },
];

function FieldError({ message, id }: { message?: string; id: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-sm text-destructive">
      {message}
    </p>
  );
}

/** Izbirni seznam; prazna izbira je null. Za needsGarden pretvori "true"/"false" v boolean. */
function SelectField({
  control,
  name,
  label,
  options,
  emptyLabel,
  boolean = false,
}: {
  control: Control<FormInput>;
  name: FieldPath<FormInput>;
  label: string;
  options: Option[];
  emptyLabel: string;
  boolean?: boolean;
}) {
  const id = `f-${name}`;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <div className="flex flex-col gap-2">
          <Label htmlFor={id}>{label}</Label>
          <NativeSelect
            id={id}
            className="w-full"
            name={field.name}
            ref={field.ref}
            onBlur={field.onBlur}
            value={field.value === null || field.value === undefined ? "" : String(field.value)}
            onChange={(e) => {
              const v = e.target.value;
              field.onChange(v === "" ? null : boolean ? v === "true" : v);
            }}
            aria-invalid={!!fieldState.error}
            aria-describedby={fieldState.error ? `${id}-error` : undefined}
          >
            <NativeSelectOption value="">{emptyLabel}</NativeSelectOption>
            {options.map((o) => (
              <NativeSelectOption key={o.value} value={o.value}>
                {o.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <FieldError id={`${id}-error`} message={fieldState.error?.message} />
        </div>
      )}
    />
  );
}

function CheckboxField({ control, name, label }: { control: Control<FormInput>; name: FieldPath<FormInput>; label: string }) {
  const id = `f-${name}`;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="flex items-center gap-2">
          <Checkbox id={id} checked={field.value === true} onCheckedChange={(checked) => field.onChange(checked === true)} />
          <Label htmlFor={id} className="font-normal">
            {label}
          </Label>
        </div>
      )}
    />
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4 rounded-xl border p-4 sm:p-6">
      <legend className="px-1 text-base font-medium">{title}</legend>
      {description && <p className="-mt-2 text-sm text-muted-foreground">{description}</p>}
      {children}
    </fieldset>
  );
}

export function AnimalForm({
  defaultValues,
  submitLabel,
  onSubmit,
}: {
  defaultValues: FormInput;
  submitLabel: string;
  onSubmit: (values: AnimalInput) => Promise<ActionResult>;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ error?: string; saved?: boolean }>({});
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
    reset,
  } = useForm<FormInput, unknown, AnimalInput>({ resolver: zodResolver(animalInputSchema), defaultValues });

  const submit = handleSubmit((values) => {
    setResult({});
    startTransition(async () => {
      const res = await onSubmit(values);
      if (res.ok) {
        reset(values);
        setResult({ saved: true });
        return;
      }
      for (const [field, message] of Object.entries(res.fieldErrors ?? {})) {
        setError(field as FieldPath<FormInput>, { message });
      }
      setResult({ error: res.error });
    });
  });

  const text = (name: "name" | "birthDateApprox" | "intakeDate", label: string, type = "text") => {
    const id = `f-${name}`;
    return (
      <div className="flex flex-col gap-2">
        <Label htmlFor={id}>{label}</Label>
        <Input
          id={id}
          type={type}
          {...register(name)}
          aria-invalid={!!errors[name]}
          aria-describedby={errors[name] ? `${id}-error` : undefined}
        />
        <FieldError id={`${id}-error`} message={errors[name]?.message} />
      </div>
    );
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <Section title="Osnovni podatki">
        <div className="grid gap-4 sm:grid-cols-2">
          {text("name", "Ime")}
          <SelectField control={control} name="species" label="Vrsta" options={options(SPECIES_LABEL)} emptyLabel="Izberite …" />
          <SelectField control={control} name="sex" label="Spol" options={options(SEX_LABEL)} emptyLabel="Izberite …" />
          {text("birthDateApprox", "Ocenjen datum rojstva", "date")}
          {text("intakeDate", "Datum sprejema", "date")}
        </div>
      </Section>

      <Section
        title="Vedenjske lastnosti"
        description="Žival lahko označite kot na voljo šele, ko so vse lastnosti izpolnjene. Vrednost »neznano« šteje kot izpolnjena."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField control={control} name="size" label="Velikost" options={options(SIZE_LABEL)} emptyLabel="— ni vneseno —" />
          <SelectField control={control} name="energyLevel" label="Raven energije" options={options(ENERGY_LABEL)} emptyLabel="— ni vneseno —" />
          <SelectField control={control} name="needsGarden" label="Potrebuje vrt" options={GARDEN_OPTIONS} emptyLabel="— ni vneseno —" boolean />
          <SelectField control={control} name="goodWithKids" label="Primerna za otroke" options={options(KIDS_LABEL)} emptyLabel="— ni vneseno —" />
          <SelectField control={control} name="goodWithDogs" label="Primerna za pse" options={options(COMPATIBILITY_LABEL)} emptyLabel="— ni vneseno —" />
          <SelectField control={control} name="goodWithCats" label="Primerna za mačke" options={options(COMPATIBILITY_LABEL)} emptyLabel="— ni vneseno —" />
        </div>
      </Section>

      <Section title="Oznake">
        <div className="flex flex-wrap gap-6">
          <CheckboxField control={control} name="isChipped" label="Čipirana" />
          <CheckboxField control={control} name="isVaccinated" label="Cepljena" />
          <CheckboxField control={control} name="isNeutered" label="Sterilizirana / kastrirana" />
        </div>
      </Section>

      <Section title="Opis">
        <div className="flex flex-col gap-2">
          <Label htmlFor="f-description">Javni opis</Label>
          <Textarea id="f-description" rows={4} {...register("description")} aria-invalid={!!errors.description} />
          <FieldError id="f-description-error" message={errors.description?.message} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="f-internalNotes">Vedenjske opombe (vidne samo osebju)</Label>
          <Textarea id="f-internalNotes" rows={3} {...register("internalNotes")} aria-invalid={!!errors.internalNotes} />
          <FieldError id="f-internalNotes-error" message={errors.internalNotes?.message} />
        </div>
      </Section>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Shranjevanje …" : submitLabel}
        </Button>
        <p role="status" className="text-sm">
          {result.error && <span className="text-destructive">{result.error}</span>}
          {result.saved && !isDirty && <span className="text-muted-foreground">Spremembe so shranjene.</span>}
        </p>
      </div>
    </form>
  );
}
