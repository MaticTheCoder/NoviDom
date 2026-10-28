# 05 – Uporabniške zgodbe

Uporabniške zgodbe izhajajo iz funkcionalnosti F1–F15, opredeljenih v `02-funkcionalnosti-in-obseg.md`. Vsaka funkcionalnost ima eno uporabniško zgodbo, zgodbe za MVP funkcionalnosti so označene. Vsaka zgodba opisuje eno samo zahtevo z enim razlogom (INVEST – *Small*), acceptance criteria pa preverjajo samo to zahtevo.

Uporabniške vloge: **obiskovalec** (neprijavljen), **posvojitelj**, **prostovoljec**, **vodja zavetišča**.

Stanja vloge, na katera se sklicujejo pogoji: *oddana, v pregledu, ogled dogovorjen, ogled opravljen, odobrena, zavrnjena, umaknjena, posvojena*. Aktivna stanja so *oddana, v pregledu, ogled dogovorjen, ogled opravljen* in *odobrena*.

## Pregled

| Oznaka | Funkcionalnost | Vloga | MVP |
|---|---|---|---|
| US-01 | F1 – Kartoteka živali s statusi | Vodja zavetišča | ✅ |
| US-02 | F2 – Vloga z vprašalnikom in preverjanjem pravil | Posvojitelj | ✅ |
| US-03 | F3 – Samodejna ocena ujemanja | Posvojitelj | ✅ |
| US-04 | F4 – Obravnava vloge po stanjih | Vodja zavetišča | ✅ |
| US-05 | F5 – Rezervacija ogleda iz prostih terminov | Posvojitelj | ✅ |
| US-06 | F6 – Zapisnik ogleda s priporočilom | Prostovoljec | ✅ |
| US-07 | F7 – Zaključek posvojitve | Vodja zavetišča | ✅ |
| US-08 | F8 – Javni katalog z iskanjem in filtri | Obiskovalec | |
| US-09 | F9 – Upravljanje urnika terminov | Vodja zavetišča | |
| US-10 | F10 – E-poštna obvestila | Posvojitelj | |
| US-11 | F11 – Nadzorna plošča vodje | Vodja zavetišča | |
| US-12 | F12 – Shranjena iskanja | Posvojitelj | |
| US-13 | F13 – Evidenca vrnitve živali | Vodja zavetišča | |
| US-14 | F14 – Upravljanje prostovoljcev | Vodja zavetišča | |
| US-15 | F15 – Koledar terminov s samodejnim usklajevanjem | Vodja zavetišča | |

---

## US-01 – Objava živali v katalogu – **MVP**

- **Funkcionalnost:** F1 – Kartoteka živali s statusi
- **Vloga:** Vodja zavetišča

**Uporabniška zgodba:**
Kot **vodja zavetišča** želim **žival označiti kot *na voljo***, da **se v javnem katalogu prikaže šele, ko je pripravljena na posvojitev**.

**Acceptance criteria:**
1. Nova žival ima status *sprejeta* in se ne prikaže v javnem katalogu.
2. Gumb »Označi kot na voljo« je aktiven le, če nobena vedenjska lastnost (velikost, raven energije, potreba po vrtu, primernost za otroke, pse in mačke) ni prazna; vrednost »neznano« velja kot izpolnjena. Sicer sistem izpiše, katere lastnosti manjkajo.
3. Ko vodja žival označi kot *na voljo*, se ta prikaže v javnem katalogu ob naslednjem nalaganju strani.
4. Vodja lahko status ročno spremeni samo med *sprejeta* in *na voljo*; statusa *rezervirana* in *posvojena* nista ročno izbirna, ker ju žival dobi le prek odobritve vloge oziroma zaključka posvojitve.
5. Žival z vsaj eno aktivno vlogo ni mogoče vrniti v status *sprejeta*; sistem prikaže sporočilo s številom aktivnih vlog.

---

## US-02 – Oddaja vloge za posvojitev – **MVP**

- **Funkcionalnost:** F2 – Vloga z vprašalnikom o gospodinjstvu in preverjanjem pravil
- **Vloga:** Posvojitelj

**Uporabniška zgodba:**
Kot **posvojitelj** želim **oddati vlogo za izbrano žival skupaj z vprašalnikom o svojem gospodinjstvu**, da **zavetišče dobi vse podatke za odločitev brez dodatnih klicev**.

**Acceptance criteria:**
1. Gumb »Oddaj vlogo« je prikazan samo pri živalih s statusom *na voljo*; neprijavljen uporabnik je ob kliku preusmerjen na prijavo in po njej vrnjen na profil živali.
2. Če posvojitelj še nima izpolnjenega vprašalnika o gospodinjstvu, ga mora izpolniti pred oddajo; ob naslednjih vlogah je vprašalnik vnaprej izpolnjen.
3. Če ima posvojitelj za to žival že aktivno vlogo, se vloga ne odda in prikaže se sporočilo »Za to žival že imate aktivno vlogo« s povezavo nanjo.
4. Če ima posvojitelj že 3 aktivne vloge, se nova vloga ne odda in prikaže se sporočilo z navodilom, da mora eno vlogo umakniti.
5. Ob uspešni oddaji ima vloga stanje *oddana*, shrani se kopija vprašalnika, posvojitelj pa je preusmerjen na podrobnost vloge.

---

## US-03 – Ocena ujemanja pred oddajo vloge – **MVP**

- **Funkcionalnost:** F3 – Samodejna ocena ujemanja
- **Vloga:** Posvojitelj

**Uporabniška zgodba:**
Kot **posvojitelj** želim **pred oddajo vloge videti oceno ujemanja svojega gospodinjstva z izbrano živaljo**, da **ne oddam vloge za žival, ki pri meni ne bi bila srečna**.

**Acceptance criteria:**
1. Na strani za oddajo vloge je prikazana oznaka *Ujemanje* (zelena), *Pogojno* (rumena) ali *Neujemanje* (rdeča); brez opozoril je oznaka *Ujemanje*.
2. Če ima gospodinjstvo vsaj enega otroka, mlajšega od 6 let, in je žival označena kot neprimerna za otroke, se prikaže opozorilo z imenom živali in razlogom; oznaka je *Neujemanje*.
3. Če gospodinjstvo nima vrta in žival potrebuje vrt, ali če je žival dnevno sama več kot 6 ur in ima visoko raven energije, se prikaže ustrezno opozorilo; oznaka je največ *Pogojno*.
4. Vsako opozorilo navede podatek iz vprašalnika, ki ga je sprožil (npr. »V gospodinjstvu: otrok, star 4 leta«).
5. Opozorila ne preprečijo oddaje; ob oznaki *Neujemanje* mora posvojitelj pred oddajo označiti potrditveno polje »Seznanjen sem z opozorili«.

---

## US-04 – Obravnava vloge po stanjih – **MVP**

- **Funkcionalnost:** F4 – Obravnava vloge po stanjih
- **Vloga:** Vodja zavetišča

**Uporabniška zgodba:**
Kot **vodja zavetišča** želim **vlogo voditi skozi stanja obravnave do odločitve**, da **vsak kandidat dobi jasen odgovor na svojo vlogo**.

**Acceptance criteria:**
1. Na podrobnosti vloge so prikazani samo gumbi za prehode, ki so iz trenutnega stanja dovoljeni vodji (npr. pri *oddana* le »Prevzemi v pregled« in »Zavrni«).
2. Gumb »Odobri« je aktiven le, ko je vloga v stanju *ogled opravljen*; ob odobritvi žival preide v status *rezervirana*.
3. Če ima žival že odobreno vlogo, druge vloge ni mogoče odobriti; prikaže se sporočilo s povezavo na odobreno vlogo.
4. Zavrnitev brez komentarja z vsaj 10 znaki ni mogoča.
5. Vsak prehod se zabeleži v zgodovino vloge z datumom, časom, izvajalcem, prejšnjim in novim stanjem ter komentarjem; zgodovine ni mogoče urejati ali brisati.

---

## US-05 – Rezervacija termina ogleda – **MVP**

- **Funkcionalnost:** F5 – Rezervacija ogleda iz prostih terminov
- **Vloga:** Posvojitelj

**Uporabniška zgodba:**
Kot **posvojitelj** želim **sam rezervirati prost termin za ogled živali**, da **se mi ni treba z zavetiščem dogovarjati po telefonu**.

**Acceptance criteria:**
1. Gumb »Rezerviraj ogled« je viden le, ko je vloga v stanju *v pregledu*.
2. Prikazani so samo prosti termini v naslednjih 14 dneh; zasedeni in preklicani termini niso izbirni.
3. Rezerviran termin ni več prikazan med prostimi termini drugim posvojiteljem.
4. Ob potrditvi rezervacije vloga preide v *ogled dogovorjen*, posvojitelj pa na podrobnosti vloge vidi datum, uro in naslov zavetišča.
5. Če drug posvojitelj termin rezervira, medtem ko ga ta posvojitelj potrjuje, se rezervacija ne izvede; prikaže se sporočilo »Termin je bil pravkar zaseden« in osvežen seznam prostih terminov.

---

## US-06 – Vnos zapisnika ogleda – **MVP**

- **Funkcionalnost:** F6 – Zapisnik ogleda s priporočilom
- **Vloga:** Prostovoljec

**Uporabniška zgodba:**
Kot **prostovoljec** želim **po ogledu vnesti zapisnik s priporočilom**, da **ima vodja pri odločitvi moje opažanje iz neposrednega stika kandidata z živaljo**.

**Acceptance criteria:**
1. Obrazec za zapisnik je dostopen samo prostovoljcu, ki mu je termin dodeljen, in šele po začetku termina.
2. Zapisnik je mogoče oddati le, če je izbrano priporočilo (*Priporočam / S pridržki / Ne priporočam*) in vneseno besedilo z vsaj 20 znaki.
3. Ob oddaji zapisnika vloga preide v *ogled opravljen*.
4. Prostovoljec lahko zapisnik ureja 24 ur po oddaji, kasneje je zapisnik samo za branje.
5. Zapisnik je viden vodji na podrobnosti vloge, posvojitelj pa ga nikoli ne vidi.

---

## US-07 – Zaključek posvojitve – **MVP**

- **Funkcionalnost:** F7 – Zaključek posvojitve s samodejnim zapiranjem vlog
- **Vloga:** Vodja zavetišča

**Uporabniška zgodba:**
Kot **vodja zavetišča** želim **ob predaji živali z enim klikom zaključiti posvojitev**, da **ostalim kandidatom za to žival ni treba čakati na odgovor**.

**Acceptance criteria:**
1. Gumb »Zaključi posvojitev« je prikazan samo pri vlogi v stanju *odobrena*.
2. Pred potrditvijo se prikaže okno s številom ostalih aktivnih vlog za to žival, ki bodo samodejno zavrnjene.
3. Po potrditvi ima vloga stanje *posvojena*, žival status *posvojena*, vse ostale aktivne vloge za isto žival pa stanje *zavrnjena* z razlogom »Žival je posvojena«.
4. Če katerakoli od sprememb ne uspe, se ne izvede nobena (žival ne ostane *posvojena* ob odprtih vlogah).
5. Samodejne zavrnitve so v zgodovini vloge zabeležene brez izvajalca (kot sistemske).

---

## US-08 – Iskanje živali v katalogu

- **Funkcionalnost:** F8 – Javni katalog z iskanjem in filtri
- **Vloga:** Obiskovalec

**Uporabniška zgodba:**
Kot **obiskovalec** želim **filtrirati živali po vrsti, starosti, velikosti in primernosti za otroke**, da **hitro najdem živali, ki ustrezajo mojemu gospodinjstvu**.

**Acceptance criteria:**
1. Katalog prikazuje samo živali s statusom *na voljo*.
2. Na voljo so filtri: vrsta, starostna skupina (do 1 leta, 1–7 let, nad 7 let), velikost, primernost za otroke, za pse in za mačke; filtri se lahko kombinirajo.
3. Vsaka kartica prikazuje naslovno fotografijo, ime, vrsto, starost in značke lastnosti.
4. Izbrani filtri so zapisani v URL, tako da lahko povezavo delim ali osvežim stran brez izgube filtrov.
5. Če ni zadetkov, se prikaže »Ni živali, ki ustrezajo filtrom« in gumb »Počisti filtre«.

---

## US-09 – Ustvarjanje termina ogleda

- **Funkcionalnost:** F9 – Upravljanje urnika terminov
- **Vloga:** Vodja zavetišča

**Uporabniška zgodba:**
Kot **vodja zavetišča** želim **ustvariti termin ogleda z dodeljenim prostovoljcem**, da **posvojitelji vidijo le termine, ko je nekdo res v zavetišču**.

**Acceptance criteria:**
1. Vodja ustvari termin z datumom, uro začetka, trajanjem (15, 30 ali 60 minut) in prostovoljcem; obrazec brez izbranega prostovoljca ni mogoče oddati.
2. Na seznamu za izbiro so samo aktivni prostovoljci.
3. Termina ni mogoče ustvariti v preteklosti ali tako, da se prekriva z obstoječim terminom istega prostovoljca; prikaže se sporočilo z navedbo konfliktnega termina.
4. Termina ni mogoče ustvariti na dan, ki je označen kot zaprt.
5. Nov termin je posvojiteljem takoj viden v izbiri prostih terminov.

---

## US-10 – Obvestilo o spremembi stanja vloge

- **Funkcionalnost:** F10 – E-poštna obvestila
- **Vloga:** Posvojitelj

**Uporabniška zgodba:**
Kot **posvojitelj** želim **prejeti e-pošto, ko se stanje moje vloge spremeni**, da **mi ni treba stalno preverjati aplikacije**.

**Acceptance criteria:**
1. Ob vsakem prehodu vloge v *v pregledu, ogled dogovorjen, odobrena, zavrnjena* ali *posvojena* posvojitelj v 5 minutah prejme e-pošto z imenom živali, novim stanjem in povezavo na vlogo.
2. Pri zavrnitvi s strani vodje e-pošta vsebuje komentar vodje.
3. Pri samodejni zavrnitvi ob zaključku posvojitve e-pošta navaja razlog »Žival je posvojena«.
4. Za prehode, ki jih izvede posvojitelj sam (umik vloge), se e-pošta ne pošlje.
5. Neuspešno poslana e-pošta se zabeleži in poskusi poslati znova največ 3-krat; neuspeh pošiljanja ne prepreči spremembe stanja vloge.

---

## US-11 – Pregled čakajočih vlog na nadzorni plošči

- **Funkcionalnost:** F11 – Nadzorna plošča vodje
- **Vloga:** Vodja zavetišča

**Uporabniška zgodba:**
Kot **vodja zavetišča** želim **na nadzorni plošči videti vloge, ki čakajo na mojo obravnavo**, da **nobena vloga ne obtiči**.

**Acceptance criteria:**
1. Na vrhu sta prikazani števili vlog v stanju *oddana* in vlog brez spremembe več kot 5 dni; klik na število odpre ustrezno filtriran seznam.
2. Tabela vlog prikazuje kandidata, žival, oceno ujemanja, stanje, datum zadnje spremembe in priporočilo prostovoljca ter omogoča filtriranje po stanju.
3. Tabela je privzeto razvrščena po datumu zadnje spremembe, najstarejše vloge najprej.
4. Vloge brez spremembe več kot 5 dni so v tabeli označene z rdečo oznako in številom dni.
5. Nadzorna plošča je dostopna le vodji; prostovoljec in posvojitelj sta ob poskusu dostopa preusmerjena na svojo začetno stran.

---

## US-12 – Obvestilo o novi primerni živali

- **Funkcionalnost:** F12 – Shranjena iskanja in obvestilo o novih živalih
- **Vloga:** Posvojitelj

**Uporabniška zgodba:**
Kot **posvojitelj** želim **prejeti obvestilo, ko se v katalogu pojavi žival, ki ustreza mojemu shranjenemu iskanju**, da **mi ni treba vsak dan pregledovati kataloga**.

**Acceptance criteria:**
1. Ko žival preide v status *na voljo* in ustreza vsaj enemu shranjenemu iskanju posvojitelja, posvojitelj prejme e-pošto s fotografijo, imenom in povezavo na žival.
2. Obvestilo se ne pošlje, če bi bila ocena ujemanja z gospodinjstvom posvojitelja *Neujemanje*.
3. Obvestilo se pošlje le posvojiteljem z izpolnjenim vprašalnikom o gospodinjstvu.
4. Za isto žival posvojitelj prejme največ eno obvestilo, tudi če ustreza več njegovim iskanjem.

---

## US-13 – Evidenca vrnitve živali

- **Funkcionalnost:** F13 – Evidenca vrnitve živali
- **Vloga:** Vodja zavetišča

**Uporabniška zgodba:**
Kot **vodja zavetišča** želim **zabeležiti vrnitev posvojene živali z razlogom**, da **je razlog znan pri izbiri naslednjega posvojitelja te živali**.

**Acceptance criteria:**
1. Gumb »Evidentiraj vrnitev« je prikazan samo pri živalih s statusom *posvojena*.
2. Vnos zahteva datum vrnitve (ne v prihodnosti in ne pred datumom posvojitve) in razlog z vsaj 20 znaki.
3. Po vnosu ima žival status *na voljo*, razlog vrnitve pa je z datumom dodan k vedenjskim opombam živali.
4. Prvotna vloga ostane v stanju *posvojena*, v njeni zgodovini pa je zabeležen dogodek vrnitve.
5. Razlog vrnitve je viden vodji in prostovoljcem na profilu živali, ne pa v javnem katalogu.

---

## US-14 – Deaktivacija prostovoljca

- **Funkcionalnost:** F14 – Upravljanje prostovoljcev
- **Vloga:** Vodja zavetišča

**Uporabniška zgodba:**
Kot **vodja zavetišča** želim **deaktivirati račun prostovoljca, ki ne sodeluje več z zavetiščem**, da **nima več dostopa do podatkov kandidatov**.

**Acceptance criteria:**
1. Deaktiviran prostovoljec se ne more prijaviti; ob poskusu prijave se prikaže sporočilo »Račun je deaktiviran«.
2. Če je bil prostovoljec ob deaktivaciji prijavljen, je ob naslednji zahtevi odjavljen.
3. Pred deaktivacijo se prikaže število njegovih prihodnjih rezerviranih ogledov; po potrditvi se ti ogledi odpovejo, vloge se vrnejo v *v pregledu*, kandidati pa prejmejo obvestilo.
4. Prosti prihodnji termini deaktiviranega prostovoljca se izbrišejo in niso več vidni posvojiteljem.
5. Zapisniki deaktiviranega prostovoljca ostanejo shranjeni in vidni vodji.

---

## US-15 – Ustvarjanje ponavljajočih se terminov

- **Funkcionalnost:** F15 – Koledar terminov ogleda s samodejnim usklajevanjem
- **Vloga:** Vodja zavetišča

**Uporabniška zgodba:**
Kot **vodja zavetišča** želim **termine ogledov ustvariti po ponavljajočem se pravilu**, da **mi ni treba ročno vnašati vsakega termina posebej**.

**Acceptance criteria:**
1. Vodja vnese pravilo (dan v tednu, časovni okvir, trajanje termina, prostovoljec, število tednov do največ 12); sistem pred potrditvijo prikaže predogled terminov, ki bodo ustvarjeni.
2. Pri generiranju se izpustijo zaprti dnevi in termini, ki bi se prekrivali z obstoječimi termini istega prostovoljca; predogled prikaže, koliko terminov je bilo izpuščenih in zakaj.
3. Če pravilo ne ustvari nobenega termina, gumb »Potrdi« ni aktiven in prikaže se razlog.
4. Po potrditvi se ustvarijo natanko termini iz predogleda in so takoj vidni posvojiteljem v izbiri prostih terminov.
5. Termini so shranjeni v UTC in prikazani v času Europe/Ljubljana; termin, ustvarjen za soboto ob 10:00, je ob 10:00 prikazan tudi po prehodu na zimski ali poletni čas.
