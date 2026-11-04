import { hashPassword } from "../src/auth/password";
import { prisma } from "../src/db";
import type { Prisma } from "../src/generated/prisma/client";

// Testni podatki za lokalni razvoj. Skripta je idempotentna: uporabnike posodobi
// po e-pošti, živali pa pobriše in ustvari na novo.
// Vsi testni uporabniki imajo geslo SEED_PASSWORD.
const SEED_PASSWORD = "NoviDom123!";

const USERS = [
  { email: "vodja@novidom.si", name: "Mojca Vodja", role: "MANAGER" },
  { email: "prostovoljec1@novidom.si", name: "Luka Prostovoljec", role: "VOLUNTEER", phone: "041 111 111" },
  { email: "prostovoljec2@novidom.si", name: "Nina Prostovoljka", role: "VOLUNTEER", phone: "041 222 222" },
  { email: "ana@example.com", name: "Ana Novak", role: "ADOPTER", phone: "040 333 333" },
  { email: "marko@example.com", name: "Marko Kranjc", role: "ADOPTER", phone: "040 444 444" },
] as const;

const yearsAgo = (years: number) => {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() - years);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

type SeedAnimal = Omit<Prisma.AnimalCreateManyInput, "createdById">;

const ANIMALS: SeedAnimal[] = [
  {
    name: "Rex", species: "DOG", sex: "MALE", birthDateApprox: yearsAgo(3),
    size: "LARGE", energyLevel: "HIGH", needsGarden: true,
    goodWithKids: "OVER_6", goodWithDogs: "YES", goodWithCats: "NO",
    isChipped: true, isVaccinated: true, isNeutered: true, status: "AVAILABLE",
    description: "Igriv nemški ovčar, ki obožuje dolge sprehode in igro z žogo.",
    internalNotes: "Vleče na povodcu, potrebuje izkušenega lastnika.",
  },
  {
    name: "Luna", species: "DOG", sex: "FEMALE", birthDateApprox: yearsAgo(1),
    size: "MEDIUM", energyLevel: "MEDIUM", needsGarden: false,
    goodWithKids: "YES", goodWithDogs: "YES", goodWithCats: "YES",
    isChipped: true, isVaccinated: true, isNeutered: false, status: "AVAILABLE",
    description: "Prijazna mešanka, ki se razume z vsemi – otroki, psi in mačkami.",
  },
  {
    name: "Bobi", species: "DOG", sex: "MALE", birthDateApprox: yearsAgo(9),
    size: "SMALL", energyLevel: "LOW", needsGarden: false,
    goodWithKids: "YES", goodWithDogs: "UNKNOWN", goodWithCats: "UNKNOWN",
    isChipped: true, isVaccinated: true, isNeutered: true, status: "AVAILABLE",
    description: "Umirjen starejši gospod, ki najraje dremlje na kavču.",
  },
  {
    name: "Ajda", species: "DOG", sex: "FEMALE", birthDateApprox: yearsAgo(5),
    size: "LARGE", energyLevel: "MEDIUM", needsGarden: true,
    goodWithKids: "NO", goodWithDogs: "NO", goodWithCats: "NO",
    isChipped: true, isVaccinated: true, isNeutered: true, status: "AVAILABLE",
    description: "Zvesta psička, ki si želi miren dom brez drugih živali.",
    internalNotes: "Ob hrupu otrok postane nemirna.",
  },
  {
    name: "Tim", species: "DOG", sex: "MALE", birthDateApprox: yearsAgo(2),
    size: "MEDIUM", energyLevel: "HIGH", needsGarden: true,
    goodWithKids: "YES", goodWithDogs: "YES", goodWithCats: "UNKNOWN",
    isChipped: true, isVaccinated: false, isNeutered: false, status: "INTAKE",
    description: "Energičen mladič, pravkar sprejet v zavetišče.",
  },
  {
    name: "Muri", species: "CAT", sex: "MALE", birthDateApprox: yearsAgo(4),
    size: "MEDIUM", energyLevel: "LOW", needsGarden: false,
    goodWithKids: "YES", goodWithDogs: "NO", goodWithCats: "YES",
    isChipped: true, isVaccinated: true, isNeutered: true, status: "AVAILABLE",
    description: "Lenoben mačak, ki obožuje crkljanje.",
  },
  {
    name: "Mica", species: "CAT", sex: "FEMALE", birthDateApprox: yearsAgo(0.5),
    size: "SMALL", energyLevel: "HIGH", needsGarden: false,
    goodWithKids: "OVER_6", goodWithDogs: "UNKNOWN", goodWithCats: "YES",
    isChipped: false, isVaccinated: true, isNeutered: false, status: "AVAILABLE",
    description: "Radovedna mucka, ki raziskuje vsak kotiček.",
  },
  {
    name: "Tačka", species: "CAT", sex: "FEMALE", birthDateApprox: yearsAgo(11),
    size: "SMALL", energyLevel: "LOW", needsGarden: false,
    goodWithKids: "YES", goodWithDogs: "YES", goodWithCats: "NO",
    isChipped: true, isVaccinated: true, isNeutered: true, status: "AVAILABLE",
    description: "Nežna starejša muca, ki išče miren dom za jesen življenja.",
  },
  {
    name: "Garfi", species: "CAT", sex: "MALE", birthDateApprox: yearsAgo(6),
    size: "LARGE", energyLevel: "MEDIUM", needsGarden: true,
    goodWithKids: "UNKNOWN", goodWithDogs: "NO", goodWithCats: "UNKNOWN",
    isChipped: true, isVaccinated: true, isNeutered: true, status: "AVAILABLE",
    description: "Velik mačak, navajen izhodov na vrt.",
  },
  {
    // Namerno brez vedenjskih lastnosti: gumba »Označi kot na voljo« ne bo mogoče uporabiti (US-01 AC 2).
    name: "Snežka", species: "CAT", sex: "FEMALE", birthDateApprox: yearsAgo(2),
    isChipped: false, isVaccinated: false, isNeutered: false, status: "INTAKE",
    description: "Pravkar sprejeta, vedenje še ni ocenjeno.",
  },
];

async function main() {
  const passwordHash = await hashPassword(SEED_PASSWORD);

  const users = await Promise.all(
    USERS.map((u) =>
      prisma.user.upsert({
        where: { email: u.email },
        update: { name: u.name, role: u.role, phone: "phone" in u ? u.phone : null, passwordHash, isActive: true },
        create: { ...u, passwordHash },
      }),
    ),
  );
  const manager = users.find((u) => u.role === "MANAGER")!;

  await prisma.animal.deleteMany(); // fotografije se izbrišejo kaskadno
  for (const animal of ANIMALS) {
    await prisma.animal.create({
      data: {
        ...animal,
        createdById: manager.id,
        photos: {
          create: [{ url: animal.species === "DOG" ? "/animals/pes.svg" : "/animals/macka.svg", sortOrder: 0 }],
        },
      },
    });
  }

  console.log(`Seed: ${users.length} uporabnikov (geslo: ${SEED_PASSWORD}), ${ANIMALS.length} živali.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
