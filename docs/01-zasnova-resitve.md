# 01 – Zasnova rešitve

## Ime rešitve

**Novi dom** – spletna platforma za vodenje posvojitev živali iz zavetišča.

## Namen in problem

Manjša zavetišča (npr. društvena ali občinska zavetišča za pse in mačke) posvojitve večinoma vodijo prek telefona, e-pošte, Facebook sporočil in papirnih obrazcev. Posledice:

- **Ni pregleda nad vlogami.** Za isto žival se javi več ljudi, podatki so razpršeni po različnih kanalih, vodja ne ve, kdo je že bil na ogledu in kdo še čaka na odgovor.
- **Podvajanje dela.** Prostovoljci vsakemu kandidatu po telefonu postavljajo ista vprašanja (kje živi, ali ima vrt, otroke, druge živali).
- **Slabo ujemanje.** Ker podatki o gospodinjstvu niso zbrani sistematično, se neprimernost (npr. pes, ki ne prenaša otrok, v družino z malimi otroki) pogosto pokaže šele ob ogledu ali po posvojitvi, kar vodi v vračila živali.
- **Kandidati ne dobijo odgovora.** Ko je žival posvojena, ostali zainteresirani pogosto nikoli ne izvejo, da njihova vloga ni več aktualna.

Novi dom vse to združi v en potek: od objave živali, prek strukturirane vloge in ogleda, do zaključka posvojitve, pri čemer sistem sam uveljavlja pravila (kdo lahko kaj odda, kdaj, za katero žival) in samodejno obvešča udeležene.

## Ciljni uporabniki

| Uporabnik | Kdo je | V kakšni situaciji uporablja rešitev |
|---|---|---|
| **Posvojitelj** | Posameznik ali družina, ki želi posvojiti psa ali mačko | Doma brska po katalogu, odda vlogo, rezervira termin ogleda in spremlja stanje vloge |
| **Prostovoljec** | Član društva, ki pomaga v zavetišču | V zavetišču izvaja oglede s kandidati in po ogledu vnese zapisnik in priporočilo |
| **Vodja zavetišča** | Oseba, odgovorna za posvojitve | Vnaša živali, pregleduje vloge, odobri ali zavrne kandidata in zaključi posvojitev |

Rešitev je zasnovana za **eno zavetišče** (ena namestitev = eno zavetišče). Podpora več zavetiščem je predvidena kot nadgradnja.

## Kratek opis delovanja

1. **Vodja zavetišča** vnese žival: vrsta, starost, velikost, raven energije, fotografije in vedenjske lastnosti (primerna za otroke, za druge pse, za mačke, potrebuje vrt). Ko je žival pripravljena, ji nastavi status *na voljo* in se pojavi v javnem katalogu.
2. **Posvojitelj** se registrira in ob prvi vlogi izpolni **vprašalnik o gospodinjstvu** (tip bivanja, vrt, otroci in njihova starost, druge živali, koliko ur dnevno je žival sama). Vprašalnik se shrani na profil in se uporabi pri vseh nadaljnjih vlogah.
3. Ob oddaji vloge sistem preveri pravila (žival mora biti na voljo, posvojitelj ima lahko le eno aktivno vlogo na žival in največ tri aktivne vloge skupaj) in izračuna **oceno ujemanja** med gospodinjstvom in lastnostmi živali. Neujemanja se prikažejo kot opozorila, vlogo pa je še vedno mogoče oddati.
4. **Vodja** vlogo prevzame v pregled. Posvojitelj nato rezervira **termin ogleda** iz prostih terminov, ki so dodeljeni prostovoljcem.
5. **Prostovoljec** izvede ogled v zavetišču in vnese zapisnik s priporočilom (priporočam / s pridržki / ne priporočam).
6. **Vodja** na podlagi vloge, ocene ujemanja in zapisnika vlogo **odobri ali zavrne**. Za vsako žival je lahko odobrena največ ena vloga; žival dobi status *rezervirana*.
7. Ob predaji živali vodja **zaključi posvojitev**: žival dobi status *posvojena*, vse ostale aktivne vloge za to žival se samodejno zavrnejo z razlogom »žival je posvojena«, vsi kandidati prejmejo obvestilo.

Vsaka sprememba stanja vloge se zabeleži (kdo, kdaj, iz katerega v katero stanje, komentar), zato je potek posvojitve sledljiv.

### Primer uporabe

Ana in Marko imata 4-letnega otroka in stanovanje brez vrta. V katalogu najdeta psa Rexa in oddata vlogo. Sistem prikaže opozorilo: »Rex je označen kot neprimeren za gospodinjstva z otroki, mlajšimi od 6 let.« Ana ga kljub temu odda z opombo. Vodja vlogo prevzame, Ana rezervira ogled za soboto ob 10:00. Prostovoljec Luka po ogledu zapiše, da je Rex ob otroku nemiren, in vlogo označi z »ne priporočam«. Vodja vlogo zavrne in v komentar predlaga psičko Luno, ki je označena kot primerna za otroke.
