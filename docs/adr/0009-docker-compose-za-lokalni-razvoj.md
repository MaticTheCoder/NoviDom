---
status: "sprejeto"
date: 2026-10-13
decision-makers: Matic
---

# Docker Compose za lokalne odvisnosti

## Kontekst in opis problema

Aplikacija za razvoj potrebuje PostgreSQL in strežnik za lovljenje e-pošte. Vsak razvijalec mora imeti enake različice brez ročne namestitve.

## Dejavniki odločitve

* enaka okolja pri vseh razvijalcih
* zagon z enim ukazom
* brez vpliva na sistem razvijalca

## Obravnavane možnosti

* Docker Compose (PostgreSQL 16, Mailpit)
* ročna namestitev PostgreSQL
* oblačna baza za razvoj (Neon, Supabase)

## Odločitev

Izbrana možnost: »Docker Compose (PostgreSQL 16, Mailpit)«, ker z ukazom `docker compose up -d` dobi vsak razvijalec enako okolje, ki ga lahko kadarkoli pobriše in ponovno vzpostavi. Mailpit omogoča pregled poslanih e-poštnih obvestil brez pošiljanja pravih sporočil.

### Posledice

* Dobro, ker je okolje ponovljivo in enako na vseh računalnikih
* Dobro, ker je e-poštna obvestila (F10) mogoče testirati lokalno
* Slabo, ker je potrebna namestitev Dockerja
* Slabo, ker Docker na nekaterih sistemih porabi več virov

## Prednosti in slabosti možnosti

### Docker Compose

* Dobro: ponovljivo, en ukaz
* Slabo: zahteva Docker

### Ročna namestitev

* Dobro: brez Dockerja
* Slabo: različne različice, zahtevnejša navodila

### Oblačna baza

* Dobro: brez lokalnih virov
* Slabo: potrebna internetna povezava in računi
* Slabo: ne pokrije lovljenja e-pošte

## Dodatne informacije

Povezano: lokalni zagon v [04-arhitektura-in-tehnoloski-sklad.md](../04-arhitektura-in-tehnoloski-sklad.md).
