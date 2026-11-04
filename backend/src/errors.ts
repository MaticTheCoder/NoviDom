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
