import { hashPassword } from "../src/auth/password";
import { prisma } from "../src/db";
import type { Prisma } from "../src/generated/prisma/client";
import { addDays, shelterDate, shelterTimeToUtc, weekday } from "../src/time";

// Testni podatki za lokalni razvoj. Skripta je idempotentna: uporabnike posodobi
// po e-pošti, živali in vloge pa pobriše in ustvari na novo.
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

// Prave fotografije (Wikimedia Commons, avtorji v frontend/public/animals/ATTRIBUTION.md).
const PHOTOS: Record<string, string> = {
  Rex: "/animals/rex.jpg",
  Luna: "/animals/luna.jpg",
  Bobi: "/animals/bobi.jpg",
  Ajda: "/animals/ajda.jpg",
  Tim: "/animals/tim.jpg",
  Muri: "/animals/muri.jpg",
  Mica: "/animals/mica.jpg",
  Tačka: "/animals/tacka.jpg",
  Garfi: "/animals/garfi.jpg",
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

  // Ana ima izpolnjen vprašalnik (otrok, star 4 leta, stanovanje brez vrta), Marko ga še nima,
  // da je mogoče preizkusiti tudi prvo oddajo vloge (US-02 AC 2).
  const ana = users.find((u) => u.email === "ana@example.com")!;
  const marko = users.find((u) => u.email === "marko@example.com")!;
  const anaHousehold: Omit<Prisma.HouseholdUncheckedCreateInput, "userId"> = {
    housingType: "APARTMENT", hasGarden: false, childrenAges: [4], hasDogs: false, hasCats: true,
    hoursAlonePerDay: 8, experience: "Imela sem mačko 10 let.",
  };
  await prisma.household.upsert({ where: { userId: ana.id }, create: { ...anaHousehold, userId: ana.id }, update: anaHousehold });
  await prisma.household.deleteMany({ where: { userId: marko.id } });

  // Revizijska sled je samo za vstavljanje (sprožilec zavrne DELETE), TRUNCATE pa je dovoljen.
  await prisma.$executeRaw`TRUNCATE "ApplicationEvent", "VisitReport", "Visit", "VisitSlot", "Application" CASCADE`;
  await prisma.animal.deleteMany(); // fotografije se izbrišejo kaskadno
  for (const animal of ANIMALS) {
    await prisma.animal.create({
      data: {
        ...animal,
        createdById: manager.id,
        photos: {
          create: [{ url: PHOTOS[animal.name] ?? (animal.species === "DOG" ? "/animals/pes.svg" : "/animals/macka.svg"), sortOrder: 0 }],
        },
      },
    });
  }

  // Termini ogledov za naslednjih 14 dni (docs/04): od ponedeljka do sobote ob 10:00, 11:00
  // in 16:00 po 30 minut, izmenično za oba prostovoljca; nedelja je zaprta.
  const volunteers = users.filter((u) => u.role === "VOLUNTEER");
  const today = shelterDate(new Date());
  const slots: Prisma.VisitSlotCreateManyInput[] = [];
  for (let day = 1; day <= 14; day++) {
    const date = addDays(today, day);
    if (weekday(date) === 0) continue;
    ["10:00", "11:00", "16:00"].forEach((time, i) => {
      const startsAt = shelterTimeToUtc(date, time);
      slots.push({ startsAt, endsAt: new Date(startsAt.getTime() + 30 * 60000), volunteerId: volunteers[(day + i) % volunteers.length].id });
    });
  }
  await prisma.visitSlot.createMany({ data: slots });

  console.log(`Seed: ${users.length} uporabnikov (geslo: ${SEED_PASSWORD}), ${ANIMALS.length} živali, ${slots.length} terminov ogleda.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
