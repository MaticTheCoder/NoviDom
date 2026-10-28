---
status: "sprejeto"
date: 2026-10-13
decision-makers: Matic
---

# Avtomat stanj vloge kot eksplicitna tabela dovoljenih prehodov

## Kontekst in opis problema

Vloga za posvojitev ima osem stanj. Vsak prehod sme izvesti le določena uporabniška vloga in le ob izpolnjenih pogojih (npr. odobritev le po opravljenem ogledu, največ ena odobrena vloga na žival). Prehodi sprožajo posledice na drugih entitetah (status živali, sprostitev termina, obvestila).

## Dejavniki odločitve

* pravila prehodov na enem mestu
* preverljivost z enotskimi testi
* razumljivost za novega razvijalca
* enak potek ne glede na to, od kod je prehod sprožen (UI, sistem)

## Obravnavane možnosti

* eksplicitna tabela prehodov (iz stanja, v stanje, dovoljene vloge, pogoji) in ena funkcija `transition()`
* knjižnica za avtomate stanj (XState)
* pogoji `if` neposredno v posameznih akcijah

## Odločitev

Izbrana možnost: »eksplicitna tabela prehodov in ena funkcija `transition()`«, ker je preprosta, berljiva in zadošča za en avtomat z osmimi stanji. Vsi prehodi gredo skozi eno funkcijo, ki preveri vlogo in pogoje, izvede posledice in zapiše dogodek v zgodovino ([ADR-0007](0007-revizijska-sled-sprememb-stanja.md)).

### Posledice

* Dobro, ker je nedovoljen prehod zavrnjen na enem mestu
* Dobro, ker lahko UI iz iste tabele izpelje, katere gumbe prikazati (US-04)
* Dobro, ker je vsak prehod mogoče pokriti s testom
* Slabo, ker je treba tabelo ročno uskladiti z diagramom stanj v dokumentaciji
* Slabo, ker bi kompleksnejši vzporedni avtomati zahtevali prehod na knjižnico

## Prednosti in slabosti možnosti

### Tabela prehodov

* Dobro: preprosto, brez odvisnosti
* Slabo: ročno usklajevanje z dokumentacijo

### XState

* Dobro: vizualizacija, napredne funkcije
* Slabo: dodatna odvisnost in učna krivulja za en preprost avtomat

### if pogoji v akcijah

* Dobro: najhitrejša prva implementacija
* Slabo: pravila razpršena, lahko neskladna

## Dodatne informacije

Povezano: diagram stanj v [02-funkcionalnosti-in-obseg.md](../02-funkcionalnosti-in-obseg.md), F4, F7, US-04, US-07.
