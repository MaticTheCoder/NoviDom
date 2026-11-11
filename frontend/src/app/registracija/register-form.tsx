"use client";

import { PASSWORD_MIN_LENGTH } from "@novi-dom/backend/validation/user";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { register, type RegisterState } from "./actions";

function Field({
  name,
  label,
  state,
  hint,
  ...input
}: { name: string; label: string; state: RegisterState; hint?: string } & React.ComponentProps<typeof Input>) {
  const error = state.fieldErrors?.[name];
  const id = `r-${name}`;
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={name} aria-invalid={!!error} aria-describedby={describedBy} {...input} />
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function RegisterForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, formAction, pending] = useActionState<RegisterState, FormData>(register, {});
  const v = state.values;

  return (
    // key: ob napaki se polja ponovno izrišejo z vnesenimi vrednostmi (gesli se izpraznita).
    <form action={formAction} className="flex flex-col gap-4" key={JSON.stringify(state)}>
      {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}
      <Field name="name" label="Ime in priimek" state={state} autoComplete="name" required defaultValue={v?.name} />
      <Field name="email" label="E-poštni naslov" state={state} type="email" autoComplete="email" required defaultValue={v?.email} />
      <Field
        name="phone"
        label="Telefon (neobvezno)"
        state={state}
        type="tel"
        autoComplete="tel"
        defaultValue={v?.phone}
        hint="Za dogovor o ogledu živali."
      />
      <Field
        name="password"
        label="Geslo"
        state={state}
        type="password"
        autoComplete="new-password"
        required
        minLength={PASSWORD_MIN_LENGTH}
        hint={`Vsaj ${PASSWORD_MIN_LENGTH} znakov.`}
      />
      <Field name="passwordConfirm" label="Ponovite geslo" state={state} type="password" autoComplete="new-password" required />
      {state.error && !state.fieldErrors && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Ustvarjanje računa …" : "Ustvari račun"}
      </Button>
    </form>
  );
}
