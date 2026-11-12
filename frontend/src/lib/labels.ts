// Slovenske oznake za vrednosti enumov v UI.
import type {
  AnimalSize,
  ApplicationStatus,
  AnimalStatus,
  Compatibility,
  EnergyLevel,
  HousingType,
  KidsCompatibility,
  MatchLevel,
  Recommendation,
  VisitOutcome,
  Sex,
  Species,
} from "@novi-dom/backend/enums";

export const SPECIES_LABEL: Record<Species, string> = { DOG: "pes", CAT: "mačka" };
/** »pes«, »psička«, »mačak«, »mačka« glede na vrsto in spol. */
export const animalNoun = (species: Species, sex: Sex) =>
  species === "DOG" ? (sex === "FEMALE" ? "psička" : "pes") : sex === "FEMALE" ? "mačka" : "mačak";

export const SEX_LABEL: Record<Sex, string> = { MALE: "samec", FEMALE: "samica" };
export const SIZE_LABEL: Record<AnimalSize, string> = { SMALL: "majhna", MEDIUM: "srednja", LARGE: "velika" };
export const ENERGY_LABEL: Record<EnergyLevel, string> = { LOW: "nizka", MEDIUM: "srednja", HIGH: "visoka" };
export const KIDS_LABEL: Record<KidsCompatibility, string> = {
  YES: "da",
  OVER_6: "le za otroke nad 6 let",
  NO: "ne",
  UNKNOWN: "neznano",
};
export const COMPATIBILITY_LABEL: Record<Compatibility, string> = { YES: "da", NO: "ne", UNKNOWN: "neznano" };
export const STATUS_LABEL: Record<AnimalStatus, string> = {
  INTAKE: "sprejeta",
  AVAILABLE: "na voljo",
  RESERVED: "rezervirana",
  ADOPTED: "posvojena",
};
export const HOUSING_LABEL: Record<HousingType, string> = { APARTMENT: "stanovanje", HOUSE: "hiša" };
export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  SUBMITTED: "oddana",
  IN_REVIEW: "v pregledu",
  VISIT_SCHEDULED: "ogled dogovorjen",
  VISIT_DONE: "ogled opravljen",
  APPROVED: "odobrena",
  REJECTED: "zavrnjena",
  WITHDRAWN: "umaknjena",
  ADOPTED: "posvojena",
};
export const MATCH_LABEL: Record<MatchLevel, string> = { MATCH: "Ujemanje", CONDITIONAL: "Pogojno", MISMATCH: "Neujemanje" };

/** Datum in ura v lokalnem času zavetišča (Europe/Ljubljana). */
export const formatDateTime = (d: Date) =>
  new Intl.DateTimeFormat("sl-SI", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Ljubljana" }).format(d);
export const formatDate = (d: Date) => new Intl.DateTimeFormat("sl-SI", { dateStyle: "medium", timeZone: "Europe/Ljubljana" }).format(d);

/** Približna starost iz ocenjenega datuma rojstva: »8 mesecev«, »3 leta«. */
export function ageLabel(birthDate: Date, now = new Date()): string {
  const months = (now.getFullYear() - birthDate.getFullYear()) * 12 + now.getMonth() - birthDate.getMonth();
  if (months < 12) {
    const m = Math.max(months, 0);
    const mod = m % 100;
    return mod === 1 ? `${m} mesec` : mod === 2 ? `${m} meseca` : mod === 3 || mod === 4 ? `${m} mesece` : `${m} mesecev`;
  }
  const y = Math.floor(months / 12);
  const mod = y % 100;
  return mod === 1 ? `${y} leto` : mod === 2 ? `${y} leti` : mod === 3 || mod === 4 ? `${y} leta` : `${y} let`;
}

/** Ura v času zavetišča, npr. »10:00«. */
export const formatTime = (d: Date) =>
  new Intl.DateTimeFormat("sl-SI", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Ljubljana" }).format(d);
/** Prva črka velika (ostalo nespremenjeno, npr. ime meseca ostane z malo). */
export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** Dan termina, npr. »Četrtek, 12. november 2026«. */
export const formatVisitDay = (d: Date) =>
  capitalize(new Intl.DateTimeFormat("sl-SI", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Ljubljana" }).format(d));

export const RECOMMENDATION_LABEL: Record<Recommendation, string> = {
  RECOMMEND: "Priporočam",
  WITH_RESERVATIONS: "S pridržki",
  NOT_RECOMMEND: "Ne priporočam",
};
export const VISIT_OUTCOME_LABEL: Record<VisitOutcome, string> = {
  PENDING: "dogovorjen",
  DONE: "opravljen",
  NO_SHOW: "kandidat ni prišel",
  CANCELLED: "odpovedan",
};
