---
status: "sprejeto"
date: 2026-10-13
decision-makers: Matic
---

# Relacijska podatkovna baza PostgreSQL

## Kontekst in opis problema

Podatki so močno povezani (uporabnik – vloga – žival – ogled – termin). Ključna pravila morajo veljati tudi ob sočasnih zahtevah: največ ena odobrena vloga na žival, en aktiven ogled na termin, ena aktivna vloga na posvojitelja in žival. Zaključek posvojitve hkrati spremeni več zapisov.

## Dejavniki odločitve

* pravilnost ob sočasnih zahtevah
* transakcije čez več tabel
* tuji ključi in referenčna integriteta
* znanje razvijalca in razpoložljivost orodij

## Obravnavane možnosti

* PostgreSQL
* MongoDB
* SQLite

## Odločitev

Izbrana možnost: »PostgreSQL«, ker podpira transakcije, tuje ključe in **delne unikatne indekse** (npr. `UNIQUE (animalId) WHERE status = 'APPROVED'`), s katerimi baza sama prepreči kršitev pravil ob sočasnih zahtevah. Relacijski model naravno ustreza povezanim entitetam.

### Posledice

* Dobro, ker ključna domenska pravila zagotavlja baza, ne le aplikacijska koda
* Dobro, ker so JOIN poizvedbe za nadzorno ploščo vodje preproste
* Dobro, ker ima široko podporo orodij (Prisma, Docker slika, gostovanje)
* Slabo, ker je shema bolj toga; vsaka sprememba zahteva migracijo
* Slabo, ker je lokalno potreben zagnan strežnik baze (rešeno z Dockerjem, [ADR-0009](0009-docker-compose-za-lokalni-razvoj.md))

## Prednosti in slabosti možnosti

### PostgreSQL

* Dobro: transakcije, tuji ključi, delni unikatni indeksi
* Slabo: toga shema, migracije

### MongoDB

* Dobro: vgnezdeni dokumenti (vloga z zgodovino in ogledi) so naravni
* Dobro: fleksibilna shema
* Slabo: transakcije čez več dokumentov zahtevajo replica set
* Slabo: ni tujih ključev; povezave preko `$lookup` so okornejše

### SQLite

* Dobro: brez strežnika, ena datoteka
* Slabo: omejena sočasnost pisanja
* Slabo: nima vseh funkcij za produkcijsko gostovanje

## Dodatne informacije

Povezano: [03-podatkovni-model.md](../03-podatkovni-model.md). MongoDB je bil resno obravnavan; zavrnjen je bil zaradi zahtev po transakcijah in omejitvah med entitetami.
