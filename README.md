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

| Ukaz | Opis |
|---|---|
| `pnpm dev` | razvojni strežnik Next.js |
| `pnpm build` | produkcijski build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | preverjanje tipov v obeh paketih |
| `pnpm test` | enotski in integracijski testi (Vitest); integracijski tečejo na ločeni bazi `novidom_test`, ki se ustvari samodejno (potreben je `docker compose up -d`) |
| `pnpm db:studio` | Prisma Studio za pregled baze |

### Testni uporabniki

`pnpm db:seed` ustvari spodnje račune (vsi z geslom `NoviDom123!`) in 10 živali (8 *na voljo*, 2 *sprejeti*).

| E-pošta | Vloga |
|---|---|
| `vodja@novidom.si` | vodja zavetišča |
| `prostovoljec1@novidom.si`, `prostovoljec2@novidom.si` | prostovoljec |
| `ana@example.com`, `marko@example.com` | posvojitelj |

## Tehnologije

| Področje | Tehnologije |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Next.js Server Actions in Route Handlers, domenski paket v TypeScriptu, Zod |
| Podatkovna baza | PostgreSQL 16, Prisma ORM |
| Avtentikacija | Auth.js v5 (Credentials), argon2, JWT seja v `httpOnly` piškotku |
| Lokalni razvoj | Docker Compose (PostgreSQL, Mailpit), pnpm workspace |
| Testiranje | Vitest, Playwright |

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