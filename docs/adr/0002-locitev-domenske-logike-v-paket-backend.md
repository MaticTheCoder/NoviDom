---
status: "sprejeto"
date: 2026-10-13
decision-makers: Matic
---

# Ločitev domenske logike in dostopa do baze v paket backend/

## Kontekst in opis problema

Pri monolitu v Next.js ([ADR-0001](0001-modularni-monolit-v-nextjs.md)) obstaja nevarnost, da se poslovna pravila razpršijo po komponentah in Server Actions. Pravila, kot so prehodi stanj vloge, ocena ujemanja in zaključek posvojitve, morajo biti na enem mestu, testabilna brez brskalnika in neodvisna od spletnega ogrodja. Struktura repozitorija predvideva mapi `frontend/` in `backend/`.

## Dejavniki odločitve

* poslovna pravila na enem mestu
* testiranje pravil brez zagona Next.js
* jasna meja med UI in domeno
* skladnost s predpisano strukturo repozitorija

## Obravnavane možnosti

* pnpm workspace: `frontend/` (Next.js) in `backend/` (domenske storitve, Prisma, validacija) kot ločena paketa
* ena mapa `src/server/services` znotraj Next.js projekta
* logika neposredno v Server Actions

## Odločitev

Izbrana možnost: »pnpm workspace: `frontend/` in `backend/` kot ločena paketa«, ker meja med UI in domeno je vsiljena s strukturo paketov: `backend/` ne sme uvažati ničesar iz Next.js, `frontend/` pa do baze dostopa samo prek storitev iz `backend/`. Pravila se testirajo z Vitest neposredno nad paketom.

### Posledice

* Dobro, ker so pravila testabilna z enotskimi testi brez spletnega strežnika
* Dobro, ker je `backend/` mogoče kasneje izpostaviti kot samostojen REST API brez prepisovanja pravil
* Dobro, ker je struktura skladna z zahtevami predmeta (`frontend/`, `backend/`)
* Slabo, ker je treba vzdrževati konfiguracijo workspace (dve `package.json`, skupni `tsconfig`)
* Slabo, ker se `backend/` kljub imenu ne zažene kot samostojen strežnik, kar je lahko na prvi pogled zavajajoče

## Prednosti in slabosti možnosti

### pnpm workspace z dvema paketoma

* Dobro: meja med sloji je vidna in preverljiva
* Slabo: nekaj dodatne konfiguracije

### src/server/services v Next.js

* Dobro: najenostavnejša postavitev
* Slabo: meja je le dogovor, nič ne prepreči uvoza Next.js v domeno

### logika v Server Actions

* Dobro: najmanj datotek
* Slabo: pravila razpršena in vezana na ogrodje
* Slabo: težko testiranje

## Dodatne informacije

Povezano: [ADR-0001](0001-modularni-monolit-v-nextjs.md), [ADR-0006](0006-avtomat-stanj-vloge.md).
