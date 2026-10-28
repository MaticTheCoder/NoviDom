---
status: "sprejeto"
date: 2026-10-13
decision-makers: Matic
---

# Modularni monolit v Next.js namesto ločenega frontenda in API strežnika

## Kontekst in opis problema

Novi dom potrebuje spletni vmesnik za štiri vloge in strežniški del s poslovnimi pravili (stanja vloge, ocena ujemanja, termini). Odločiti se je bilo treba, ali bosta uporabniški vmesnik in strežnik ločeni aplikaciji, ki komunicirata prek REST API, ali ena aplikacija. Projekt razvija ena oseba v okviru semestra.

## Dejavniki odločitve

* en razvijalec in omejen čas (en semester)
* skupni tipi med UI in strežnikom zmanjšajo napake
* enostaven lokalni zagon za razvijalca, ki se pridruži kasneje
* možnost kasnejše izpostavitve API (javni API, PWA za prostovoljce)

## Obravnavane možnosti

* Next.js (App Router) kot ena aplikacija za UI in strežniški del
* React SPA (Vite) + ločen Express/NestJS REST API
* React SPA + Backend-as-a-Service (Firebase, Supabase)

## Odločitev

Izbrana možnost: »Next.js (App Router) kot ena aplikacija za UI in strežniški del«, ker omogoča največ funkcionalnosti z najmanj infrastrukture: en jezik, en proces, en zagon, tipi se delijo brez generiranja odjemalca API. Server Actions in Route Handlers pokrijejo vse potrebe po strežniški logiki. Ločljivost je zagotovljena z izločitvijo domenske logike v svoj paket ([ADR-0002](0002-locitev-domenske-logike-v-paket-backend.md)).

### Posledice

* Dobro, ker zadošča en ukaz za zagon in en proces za razhroščevanje
* Dobro, ker se spremembe modela takoj odrazijo v UI preko TypeScript tipov
* Dobro, ker je strežniško upodabljanje (SSR) javnega kataloga hitro in prijazno iskalnikom
* Slabo, ker je aplikacija vezana na Next.js; menjava ogrodja zahteva prepis vstopnega sloja
* Slabo, ker ni ločenega, dokumentiranega REST API že od začetka; za zunanje odjemalce ga je treba načrtno dodati pod /api
* Slabo, ker zahteva poznavanje razlik med strežniškimi in odjemalskimi komponentami

## Prednosti in slabosti možnosti

### Next.js kot ena aplikacija

* Dobro: najmanj konfiguracije in infrastrukture
* Dobro: skupni tipi brez dodatnih orodij
* Slabo: večja vezanost na eno ogrodje

### React SPA + Express/NestJS

* Dobro: jasna ločitev, API je samostojen od začetka
* Slabo: dvojna konfiguracija, CORS, ločeno upravljanje sej
* Slabo: podvajanje tipov ali generiranje odjemalca

### React SPA + BaaS

* Dobro: hitra vzpostavitev avtentikacije in baze
* Slabo: poslovna pravila (transakcija ob posvojitvi, avtomat stanj) se težko izvedejo v pravilih BaaS
* Slabo: vezanost na zunanjega ponudnika

## Dodatne informacije

Povezano: [04-arhitektura-in-tehnoloski-sklad.md](../04-arhitektura-in-tehnoloski-sklad.md). Odločitev se ponovno pregleda, če bo potreben javni API za več odjemalcev.
