---
status: "sprejeto"
date: 2026-10-13
decision-makers: Matic
---

# Kopija vprašalnika in ocene ujemanja ob oddaji vloge

## Kontekst in opis problema

Vprašalnik o gospodinjstvu je shranjen na profilu posvojitelja in ga ta lahko kadarkoli spremeni. Vodja mora vlogo ocenjevati na podlagi podatkov, kot so bili ob oddaji, ocena ujemanja pa se ne sme spremeniti za nazaj.

## Dejavniki odločitve

* sledljivost odločitve
* nespremenljivost oddane vloge
* preprostost poizvedb

## Obravnavane možnosti

* kopija vprašalnika (JSON) ter ocena in opozorila shranjeni v vlogi ob oddaji
* vloga se sklicuje na trenutni vprašalnik, ocena se računa ob vsakem prikazu
* verzioniranje vprašalnika (vsaka sprememba nova vrstica)

## Odločitev

Izbrana možnost: »kopija vprašalnika ter ocena in opozorila shranjeni v vlogi ob oddaji«, ker je najenostavnejša rešitev, ki zagotovi nespremenljivost oddane vloge. Ocena se izračuna enkrat, zato je tudi prikaz na nadzorni plošči hiter.

### Posledice

* Dobro, ker vodja vidi točno to, kar je posvojitelj oddal
* Dobro, ker kasnejša sprememba pravil ujemanja ne spremeni ocen že oddanih vlog
* Slabo, ker so podatki podvojeni (profil in vloga)
* Slabo, ker JSON kopije ni mogoče preprosto filtrirati s SQL

## Prednosti in slabosti možnosti

### Kopija ob oddaji

* Dobro: nespremenljivo, preprosto
* Slabo: podvajanje podatkov

### Sklic na trenutni vprašalnik

* Dobro: brez podvajanja
* Slabo: vloga se spremeni za nazaj

### Verzioniranje vprašalnika

* Dobro: brez podvajanja, popolna zgodovina
* Slabo: bolj zapleten model in poizvedbe

## Dodatne informacije

Povezano: F2, F3, US-02, US-03.
