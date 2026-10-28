---
status: "sprejeto"
date: 2026-10-13
decision-makers: Matic
---

# Prisma ORM za dostop do podatkovne baze

## Kontekst in opis problema

Potreben je tipsko varen način dostopa do PostgreSQL iz TypeScripta, vodenje migracij sheme in nalaganje testnih podatkov.

## Dejavniki odločitve

* tipska varnost v TypeScriptu
* vodenje migracij
* hitrost razvoja
* podpora transakcijam

## Obravnavane možnosti

* Prisma
* Drizzle ORM
* neposreden SQL (node-postgres)

## Odločitev

Izbrana možnost: »Prisma«, ker iz sheme samodejno generira tipe, ima vgrajene migracije in seed ter podpira interaktivne transakcije (`$transaction`), ki jih potrebuje zaključek posvojitve. Razvijalec jo že pozna.

### Posledice

* Dobro, ker se napake v poizvedbah pokažejo že pri prevajanju
* Dobro, ker je shema na enem mestu (`schema.prisma`) in berljiva tudi za novega razvijalca
* Slabo, ker Prisma shema ne izrazi delnih unikatnih indeksov; dodati jih je treba z ročno SQL migracijo
* Slabo, ker zahteva korak generiranja odjemalca (`prisma generate`) po vsaki spremembi sheme

## Prednosti in slabosti možnosti

### Prisma

* Dobro: generirani tipi, migracije, seed
* Slabo: delni indeksi le z ročnim SQL

### Drizzle ORM

* Dobro: blizu SQL, podpira več funkcij PostgreSQL
* Slabo: manj izkušenj razvijalca, mlajši ekosistem

### Neposreden SQL

* Dobro: popoln nadzor
* Slabo: brez tipov in migracij, več ročnega dela

## Dodatne informacije

Povezano: [ADR-0003](0003-relacijska-baza-postgresql.md).
