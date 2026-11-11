// Podatki o zavetišču, ki jih aplikacija prikaže posvojitelju (npr. naslov ogleda, US-05 AC 4).
// Nastavljivi z okoljskimi spremenljivkami; privzete vrednosti so za lokalni razvoj.
export const SHELTER = {
  name: process.env.SHELTER_NAME ?? "Zavetišče Novi dom",
  address: process.env.SHELTER_ADDRESS ?? "Tačkova ulica 1, 1000 Ljubljana",
} as const;
