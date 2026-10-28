---
status: "sprejeto"
date: 2026-10-13
decision-makers: Matic
---

# Revizijska sled sprememb stanja vloge kot samostojna tabela

## Kontekst in opis problema

Polje `status` v vlogi hrani le trenutno stanje. Za časovnico pri posvojitelju, nadzorno ploščo (vloge brez odziva) in sledljivost odločitev ob pritožbah je treba vedeti, kdo je kdaj spremenil stanje in zakaj, tudi kadar spremembo izvede sistem (samodejna zavrnitev ob posvojitvi).

## Dejavniki odločitve

* sledljivost odločitev
* podatki za časovnico in nadzorno ploščo
* zgodovine ni mogoče naknadno spremeniti

## Obravnavane možnosti

* tabela `ApplicationEvent` samo za vstavljanje (od, do, izvajalec, komentar, čas)
* polja `updatedAt` in `updatedBy` v vlogi
* splošen dnevnik vseh sprememb v bazi (trigger, event sourcing)

## Odločitev

Izbrana možnost: »tabela `ApplicationEvent` samo za vstavljanje«, ker pokrije vse potrebe (časovnica, sledljivost, roki) z majhnim dodatnim delom. Zapis dogodka se izvede v isti transakciji kot sprememba stanja, zato zgodovina vedno ustreza dejanskemu stanju.

### Posledice

* Dobro, ker posvojitelj vidi časovnico in vodja zgodovino vsake vloge
* Dobro, ker je mogoče izračunati čas od zadnje spremembe (opomniki, US-11)
* Dobro, ker so sistemske spremembe označene z `actorId = null`
* Slabo, ker tabela raste z vsakim prehodom (pri pričakovanem obsegu zanemarljivo)
* Slabo, ker je treba zagotoviti, da noben prehod ne zaobide funkcije `transition()`

## Prednosti in slabosti možnosti

### ApplicationEvent

* Dobro: popolna zgodovina, preprosto
* Slabo: dodatna tabela

### updatedAt/updatedBy

* Dobro: najmanj dela
* Slabo: ohrani le zadnjo spremembo

### Event sourcing

* Dobro: popolna zgodovina vseh entitet
* Slabo: bistveno večja kompleksnost za ta projekt

## Dodatne informacije

Povezano: [ADR-0006](0006-avtomat-stanj-vloge.md), [03-podatkovni-model.md](../03-podatkovni-model.md).
