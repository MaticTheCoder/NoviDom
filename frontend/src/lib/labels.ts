// Slovenske oznake za vrednosti enumov v UI.
import type {
  AnimalSize,
  AnimalStatus,
  Compatibility,
  EnergyLevel,
  HousingType,
  KidsCompatibility,
  Sex,
  Species,
} from "@novi-dom/backend/enums";

export const SPECIES_LABEL: Record<Species, string> = { DOG: "pes", CAT: "mačka" };
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
