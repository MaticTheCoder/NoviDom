import { prisma } from "../src/db";

// Testni podatki (vodja, prostovoljci, posvojitelji, živali, termini)
// se dodajo skupaj z modeli v nalogah #4 in naprej.
async function main() {
  console.log("Seed: ni še modelov za polnjenje.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
