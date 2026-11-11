// Napaka poslovnega pravila. `code` je stabilen identifikator za vstopni sloj
// (npr. za izbiro prikaza v UI), `message` je besedilo za uporabnika.
export class DomainError<TDetails = unknown> extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly details?: TDetails,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError;
}

export const CommonErrorCode = {
  Forbidden: "FORBIDDEN",
  NotFound: "NOT_FOUND",
} as const;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** ID iz URL-ja; neveljaven UUID obravnavamo kot neobstoječ zapis (404 namesto napake baze). */
export const isUuid = (value: string) => UUID.test(value);
