# Novi dom

Spletna platforma, prek katere zavetišče za živali vodi celoten postopek posvojitve psov in mačk: od objave živali v javnem katalogu, prek vloge z vprašalnikom o gospodinjstvu in samodejno oceno ujemanja, rezervacije ogleda in zapisnika prostovoljca, do zaključka posvojitve, ob katerem se ostale vloge za isto žival samodejno zaprejo.

**Uporabniške vloge:** obiskovalec, posvojitelj, prostovoljec, vodja zavetišča.

## Lokalni zagon

Predpogoji: Node.js 22 LTS (`.nvmrc`), pnpm in Docker.

```bash
cp .env.example .env     # DATABASE_URL, AUTH_SECRET, SMTP_*
docker compose up -d     # PostgreSQL 16 (port 5432) in Mailpit (UI na http://localhost:8025)
pnpm install             # odvisnosti za frontend/ in backend/, generira Prisma Client
pnpm db:migrate          # migracije baze
pnpm db:seed             # testni podatki
pnpm dev                 # aplikacija na http://localhost:3000
```

Delovanje povezave z bazo preveriš na `http://localhost:3000/api/health`.

Če je port 3000 zaseden, zaženi na drugem: `pnpm dev -p 3001`.

### Po posodobitvi kode (`git pull`, združen PR)

Prisma Client v `backend/src/generated/` ni v gitu, zato ga je treba po spremembi sheme ustvariti znova. Brez tega strežnik javi npr. `Cannot convert undefined or null to object` pri uvozu enuma.

```bash
pnpm install             # posodobi odvisnosti in regenerira Prisma Client
pnpm db:migrate          # uveljavi nove migracije
```

Nato znova zaženi `pnpm dev`, ker ima tekoči strežnik stari Prisma Client naložen v pomnilniku.

### Produkcijski zagon (npr. za predstavitev)

V razvojnem načinu se vsaka stran ob prvem obisku prevaja, v produkcijskem je vse prevedeno vnaprej. Pred buildom ustavi `pnpm dev`.

```bash
pnpm build
pnpm --filter @novi-dom/frontend start -p 3001
```

| Ukaz | Opis |
|---|---|
| `pnpm dev` | razvojni strežnik Next.js |
| `pnpm build` | produkcijski build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | preverjanje tipov v obeh paketih |
| `pnpm test` | enotski in integracijski testi (Vitest); integracijski tečejo na ločeni bazi `novidom_test`, ki se ustvari samodejno (potreben je `docker compose up -d`) |
| `pnpm db:studio` | Prisma Studio za pregled baze |

### Testni uporabniki

`pnpm db:seed` ustvari spodnje račune (vsi z geslom `NoviDom123!`), 10 živali s fotografijami (8 *na voljo*, 2 *sprejeti*) in 36 terminov ogledov v naslednjih 14 dneh (pon–sob ob 10:00, 11:00 in 16:00, izmenično za oba prostovoljca). Seed ob vsakem zagonu pobriše vse vloge in termine.

| E-pošta | Vloga |
|---|---|
| `vodja@novidom.si` | vodja zavetišča |
| `prostovoljec1@novidom.si`, `prostovoljec2@novidom.si` | prostovoljec |
| `ana@example.com` | posvojiteljica z izpolnjenim vprašalnikom (stanovanje brez vrta, otrok 4 leta, mačka) |
| `marko@example.com` | posvojitelj brez vprašalnika, za prikaz prve oddaje vloge |

Posvojitelji se lahko registrirajo sami (`/registracija`). Prostovoljce in vodjo ustvari samo seed, ker upravljanje prostovoljcev (US-14) ni del MVP. Prostovoljec vidi le oglede v terminih, ki so dodeljeni njemu, zapisnik pa lahko odda šele po začetku termina.

Avtorji fotografij in licence so v [`frontend/public/animals/ATTRIBUTION.md`](frontend/public/animals/ATTRIBUTION.md).

## Tehnologije

| Področje | Tehnologije |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Next.js Server Actions in Route Handlers, domenski paket v TypeScriptu, Zod |
| Podatkovna baza | PostgreSQL 16, Prisma ORM |
| Avtentikacija | Auth.js v5 (Credentials), argon2, JWT seja v `httpOnly` piškotku |
| Lokalni razvoj | Docker Compose (PostgreSQL, Mailpit), pnpm workspace |
| Testiranje | Vitest: enotski testi (pravila, avtomat stanj, ocena ujemanja) in integracijski testi na bazi `novidom_test` (sočasnost, atomarnost) |

## Struktura repozitorija

```text
novi-dom/
├── frontend/    # Next.js aplikacija: uporabniški vmesnik in vstopni sloj (Server Actions, /api)
├── backend/     # domenski paket: poslovna pravila, Prisma shema in migracije
└── docs/        # projektna dokumentacija in arhitekturne odločitve (ADR)
```

## Dokumentacija

1. [Zasnova rešitve](docs/01-zasnova-resitve.md)
2. [Funkcionalnosti in obseg](docs/02-funkcionalnosti-in-obseg.md)
3. [Podatkovni model](docs/03-podatkovni-model.md)
4. [Arhitektura in tehnološki sklad](docs/04-arhitektura-in-tehnoloski-sklad.md)
5. [Uporabniške zgodbe](docs/05-uporabniske-zgodbe.md)
6. [Wireframes](docs/06-wireframes.md)

### Arhitekturne odločitve (ADR)

Zapisane po predlogi [MADR](https://adr.github.io/madr/), predloga: [`docs/adr/adr-template.md`](docs/adr/adr-template.md).

| ADR | Odločitev | Status |
|---|---|---|
| [0001](docs/adr/0001-modularni-monolit-v-nextjs.md) | Modularni monolit v Next.js | sprejeto |
| [0002](docs/adr/0002-locitev-domenske-logike-v-paket-backend.md) | Ločitev domenske logike v paket `backend/` | sprejeto |
| [0003](docs/adr/0003-relacijska-baza-postgresql.md) | Relacijska podatkovna baza PostgreSQL | sprejeto |
| [0004](docs/adr/0004-prisma-orm.md) | Prisma ORM | sprejeto |
| [0005](docs/adr/0005-avtentikacija-authjs-credentials-jwt.md) | Auth.js (Credentials) in JWT seja | sprejeto |
| [0006](docs/adr/0006-avtomat-stanj-vloge.md) | Avtomat stanj vloge kot tabela prehodov | sprejeto |
| [0007](docs/adr/0007-revizijska-sled-sprememb-stanja.md) | Revizijska sled sprememb stanja | sprejeto |
| [0008](docs/adr/0008-kopija-vprasalnika-ob-oddaji-vloge.md) | Kopija vprašalnika ob oddaji vloge | sprejeto |
| [0009](docs/adr/0009-docker-compose-za-lokalni-razvoj.md) | Docker Compose za lokalni razvoj | sprejeto |
| [0010](docs/adr/0010-github-flow.md) | GitHub Flow kot razvojni proces | sprejeto |

## Razvojni proces

Repozitorij uporablja [GitHub Flow](https://docs.github.com/en/get-started/using-github/github-flow). Veja `main` je zaščitena: spremembe se vanjo združujejo izključno prek pull requestov iz kratkoživih vej (`feature/…`, `fix/…`, `docs/…`).

## Avtor

Matic Koren, FERI UM, predmet RIRS