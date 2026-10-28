---
status: "sprejeto"
date: 2026-10-28
decision-makers: Matic
---

# GitHub Flow kot razvojni proces

## Kontekst in opis problema

Določiti je bilo treba, kako se spremembe vnašajo v repozitorij, da je veja `main` vedno v delujočem stanju in da je zgodovina sprememb pregledna.

## Dejavniki odločitve

* veja `main` vedno delujoča
* preprostost za enega razvijalca
* pregled sprememb pred združitvijo
* možnost samodejnih preverjanj (CI)

## Obravnavane možnosti

* GitHub Flow (kratkožive veje in pull request v `main`)
* Git Flow (veje `develop`, `release`, `hotfix`)
* neposredni commiti v `main`

## Odločitev

Izbrana možnost: »GitHub Flow«, ker je najpreprostejši proces, ki še zagotavlja pregled sprememb: vsaka funkcionalnost ali popravek nastane v svoji veji in se v `main` združi prek pull requesta. Veja `main` je zaščitena (obvezen pull request, prepoved prisilnega potiskanja in brisanja, pravila veljajo tudi za administratorja).

### Posledice

* Dobro, ker je vsaka sprememba vidna kot pull request z opisom
* Dobro, ker je na pull request mogoče kasneje priklopiti GitHub Actions (lint, testi)
* Slabo, ker je za enega razvijalca nekaj dodatnega dela (veja in pull request tudi za majhne spremembe)
* Slabo, ker ni ločenih izdaj (release vej); za ta projekt niso potrebne

## Prednosti in slabosti možnosti

### GitHub Flow

* Dobro: preprost, pregleden
* Slabo: nekaj dodatnih korakov

### Git Flow

* Dobro: podpora več hkratnim izdajam
* Slabo: preveč vej za en projekt in enega razvijalca

### Commiti v main

* Dobro: najhitreje
* Slabo: ni pregleda, main je lahko nedelujoč

## Dodatne informacije

Poimenovanje vej: `feature/<kratek-opis>`, `fix/<kratek-opis>`, `docs/<kratek-opis>`.
