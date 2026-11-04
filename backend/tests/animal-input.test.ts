import { describe, expect, it } from "vitest";
import { animalInputSchema } from "../src/validation/animal";

const valid = {
  name: "Rex",
  species: "DOG",
  sex: "MALE",
  birthDateApprox: "2022-05-01",
  intakeDate: "2024-01-10",
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

const errorsOf = (data: unknown) => {
  const r = animalInputSchema.safeParse(data);
  return r.success ? {} : Object.fromEntries(r.error.issues.map((i) => [i.path.join("."), i.message]));
};

describe("animalInputSchema", () => {
  it("sprejme žival brez vedenjskih lastnosti (vnesejo se kasneje)", () => {
    expect(animalInputSchema.safeParse(valid).success).toBe(true);
  });

  it("odstrani presledke z imena in zahteva ime", () => {
    expect(animalInputSchema.parse({ ...valid, name: "  Rex " }).name).toBe("Rex");
    expect(errorsOf({ ...valid, name: "   " })).toHaveProperty("name", "Vnesite ime.");
  });

  it("zavrne datum v prihodnosti in sprejem pred rojstvom", () => {
    expect(errorsOf({ ...valid, birthDateApprox: "2999-01-01" })).toHaveProperty("birthDateApprox");
    expect(errorsOf({ ...valid, intakeDate: "2020-01-01" })).toHaveProperty(
      "intakeDate",
      "Datum sprejema ne more biti pred datumom rojstva.",
    );
  });

  it("zavrne neznane vrednosti enumov in status v podatkih", () => {
    expect(errorsOf({ ...valid, species: "BIRD" })).toHaveProperty("species", "Izberite vrsto.");
    expect(errorsOf({ ...valid, goodWithKids: "MAYBE" })).toHaveProperty("goodWithKids");
    expect(animalInputSchema.parse({ ...valid, status: "ADOPTED" })).not.toHaveProperty("status");
  });
});
