---
status: "sprejeto"
date: 2026-10-13
decision-makers: Matic
---

# Avtentikacija z Auth.js (Credentials) in JWT sejo

## Kontekst in opis problema

Aplikacija potrebuje prijavo za tri vloge (posvojitelj, prostovoljec, vodja) in preverjanje pravic pri vsaki zahtevi. Registracija je javna le za posvojitelje, prostovoljce ustvari vodja. Rešitev mora delovati lokalno brez zunanjih storitev.

## Dejavniki odločitve

* lokalni zagon brez zunanjih računov
* vloga uporabnika dostopna ob vsaki zahtevi
* varnost gesel in sej
* možnost kasnejše prijave z Google računom

## Obravnavane možnosti

* Auth.js v5 s ponudnikom Credentials in JWT sejo v `httpOnly` piškotku
* Auth.js z sejo v podatkovni bazi
* zunanji ponudnik (Clerk, Auth0)
* lastna implementacija sej

## Odločitev

Izbrana možnost: »Auth.js v5 s ponudnikom Credentials in JWT sejo«, ker deluje brez zunanjih storitev, se neposredno integrira z Next.js (middleware, strežniške komponente), vloga je v žetonu na voljo brez poizvedbe v bazo. Gesla so zgoščena z argon2, žeton je podpisan in šifriran s ključem `AUTH_SECRET`.

### Posledice

* Dobro, ker lahko vsak razvijalec prijavo testira lokalno
* Dobro, ker middleware hitro omeji dostop do področij glede na vlogo
* Dobro, ker je OAuth ponudnika (Google) mogoče dodati brez spremembe ostale kode
* Slabo, ker JWT seje ni mogoče takoj preklicati; zato kritične operacije vlogo in `isActive` ponovno preberejo iz baze
* Slabo, ker sami skrbimo za ponastavitev gesla in povezave za aktivacijo prostovoljcev

## Prednosti in slabosti možnosti

### Auth.js + Credentials + JWT

* Dobro: brez zunanjih storitev
* Dobro: vloga v žetonu
* Slabo: preklic seje ni takojšen

### Auth.js s sejo v bazi

* Dobro: takojšen preklic seje
* Slabo: poizvedba v bazo ob vsaki zahtevi

### Clerk / Auth0

* Dobro: hitra vzpostavitev, upravljanje uporabnikov
* Slabo: zunanja odvisnost in računi
* Slabo: podatki uporabnikov pri tretji osebi

### Lastna implementacija

* Dobro: popoln nadzor
* Slabo: veliko tveganje za varnostne napake

## Dodatne informacije

Povezano: [04-arhitektura-in-tehnoloski-sklad.md](../04-arhitektura-in-tehnoloski-sklad.md), uporabniška zgodba US-14 (deaktivacija prostovoljca).
