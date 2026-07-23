# CLAUDE.md — StitchLab-YVR

Diese Datei wird bei **jedem** Chat automatisch geladen. Sie enthält die Dauerregeln, Befehle und
Architekturgrenzen dieses Repos. **Kurz halten, aktuell halten.** Ausführliche Schritt-für-Schritt-Rezepte
(neue Domäne, neues Feature, Bootstrap) stehen im Skill `nx-angular-nestjs-ddd-starter` (`.claude/skills/`).

---

## Was das ist

Nx-Monorepo (**Modular Monolith**). Backend: **NestJS 11 + CQRS**, Clean Architecture / DDD je Domäne.
Frontend: **Angular 21** (standalone, Signals) mit **Tailwind CSS v4**. Persistenz: **Prisma 7 + PostgreSQL**
(Supabase). Deployment: **Vercel + Render + Supabase**.

> **Projektzweck (TODO):** `<in ein bis zwei Sätzen beschreiben, was StitchLab-YVR fachlich tut>`.

Import-Scope: **`@stitchlab-yvr/...`** (Nx/npm-Scope, bewusst kleingeschrieben). Node **22**. Paketmanager **npm**.

---

## Befehle

Es gibt bewusst kaum npm-Skripte für Build/Test/Lint — das läuft über Nx direkt.

​```bash
npm install # Abhängigkeiten (im CI: npm install, NICHT npm ci — s. Fallstricke)
npm run db:generate # Prisma Client generieren (nach jeder Schema-Änderung)
npm run db:migrate # Migration lokal erstellen + anwenden (dev)
npm run db:studio # Prisma Studio
npm run styles:build # Tailwind v4 einmalig bauen ← VOR dem ersten Frontend-Serve nötig
npm run styles:watch # Tailwind im Watch-Modus (parallel zum Frontend-Serve)

npx nx serve backend # NestJS lokal → http://localhost:3000/api
npx nx serve frontend # Angular lokal → http://localhost:4200

npx nx build backend
npx nx build frontend --configuration=production # Output: dist/apps/frontend/browser

# Das Gate vor "fertig" (immer alle drei, nur Betroffenes):

npx nx affected -t lint test build

npx nx e2e frontend-e2e # Playwright (braucht laufende App / DB — NICHT im schnellen CI-Gate)
npx nx e2e backend-e2e
npx nx graph # Abhängigkeitsgraph / Modulgrenzen visualisieren
​```

---

## Architektur — nicht verhandelbar

Vier Schichten je Backend-Domäne, Abhängigkeiten zeigen **immer nach innen**. Diese Regel wird von ESLint
(`@nx/enforce-module-boundaries` in `eslint.config.mjs`) **hart erzwungen** — Verstöße brechen `lint`/CI.

​`
adapters → application → domain          infrastructure → domain
(HTTP/Controller)  (CQRS-Handler)  (Entities, Ports)   (Prisma-Impl)
​`

- **`domain` ist rein:** kein NestJS, kein Prisma, kein HTTP. Nur TS + `shared-contracts`.
- **Invarianten in der Entity**, nicht im DTO: Schreibpfad läuft durch `Entity.create(...)` /
  `Entity.assertValidUpdate(...)`; das Repository persistiert **aus der Entity**, nie aus dem rohen DTO.
- **CQRS:** Controller rufen `CommandBus`/`QueryBus`, nie Services direkt. Ein Command = eine Absicht = ein Handler.
- **Repository-Interface + `Symbol`-Token wohnen in `domain`**; die Prisma-Implementierung in `infrastructure`,
  gebunden per DI-Token (`{ provide: FOO_REPOSITORY, useClass: PrismaFooRepository }`).
- **`application` importiert NIE `infrastructure`.** **`adapters` importiert NIE `infrastructure` direkt.**
- **`libs/shared/contracts` ist die einzige Brücke** FE↔BE (DTOs mit `class-validator`, Interfaces, Enums,
  `DomainException`), Tag `platform:universal`. Frontend und Backend importieren nie direkt voneinander.

**Nx-Tags** (zwei Achsen je `project.json`):
`scope: domain|application|infrastructure|adapters|shared|feature|data-access` ·
`platform: backend|frontend|universal`.

**Lib-Namen:** `@stitchlab-yvr/backend-<domain>-<layer>`, `@stitchlab-yvr/frontend-<domain>-<feature|data-access>`,
`@stitchlab-yvr/shared-contracts`.

> Vollständige Rezepte inkl. Code-Skeletten und `nx g`-Befehlen: Skill `nx-angular-nestjs-ddd-starter`.

---

## Auth

JWT **Access + Refresh** in **HttpOnly-Cookies** (`Secure`, `SameSite=Strict`, kein `Domain`) — nie im
`Authorization`-Header, nie in `localStorage`. Zwei Passport-Strategien (`jwt`, `jwt-refresh`) lesen das Token aus
dem Cookie. Guards + Rollen: `JwtAuthGuard`, `JwtRefreshGuard`, `RolesGuard` + `@Roles('ADMIN')`. Passwörter mit
`bcrypt`. `JWT_SECRET` ≠ `JWT_REFRESH_SECRET`, je ≥ 32 Zeichen, beim Boot per `config.getOrThrow` erzwungen
(fehlt/zu schwach → Prozess bricht bewusst ab). Entscheidung als eigene ADR festhalten (`docs/adr/`).

---

## Tests

- **Jest** (Unit/Integration), colokiert als `*.spec.ts`, je Lib eine `jest.config.cts` (`passWithNoTests: true`).
  - Handler-Test: Repo-Interface als `jest.fn()`-Mock, `toHaveBeenCalledWith` prüfen.
  - Entity-Test: jede Invariante → `DomainException`.
  - Controller-Test: Bus-Verdrahtung + Guards.
- **Playwright** in `apps/frontend-e2e` / `apps/backend-e2e` (braucht DB/Secrets/laufende App).
- Jede neue Domänen-Regel bekommt einen Test; jede neue Route wird auf ihren Guard geprüft.

---

## Konventionen (Do & Don't)

- ✅ Vor „fertig": `npx nx affected -t lint test build` grün. Bei Verhalten zusätzlich real ausführen (`verify`-Skill),
  nach nicht-trivialen Änderungen `/code-review`.
- ✅ Jeder neue Input → DTO in `shared-contracts` mit `class-validator`-Decoratoren.
- ✅ Kommentare erklären das **Warum** (besonders bei Sicherheits-/Grenzfall-Entscheidungen), nicht das Was.
- ✅ Frontend: keine hartcodierten Strings — alles über `frontend-shared-i18n`.
  **Sprachen/Schreibrichtung: `<Sprachliste TODO>`** (kommt eine RTL-Sprache dazu, das RTL-Handling von Anfang an mitdenken).
- ✅ README/ADR (`docs/adr/`) aktualisieren, wenn sich Architektur/Setup ändert.
- ❌ Keine Secrets im Code/Repo. `.env` ist ge-`gitignore`-t; Pflicht-Env per `getOrThrow`.
- ❌ Keine Schicht-/Platform-Grenze umgehen (kein `eslint-disable` für `enforce-module-boundaries`).
- ❌ Kein Prisma/HTTP in `domain`; kein Direkt-Import von `infrastructure` aus `application`/`adapters`.

**Commits:** knappe, thematische Messages (die History nummeriert Schritte). **KEIN `Co-Authored-By: Claude`-Trailer.**
Committen/Pushen nur auf ausdrücklichen Wunsch.

---

## Deployment (Kurzform — Details in `docs/DEPLOYMENT.md`)

Empfohlener Default-Stack (bewusst kostenlos): Frontend statisch auf **Vercel**, Backend auf **Render** (Free),
DB + Storage auf **Supabase** (Free). Vercel **rewritet** `/api/*` an das Render-Backend → für den Browser alles
**same-origin** (nötig, damit die `SameSite=Strict`-Cookies mitkommen). **Rewrite, niemals Redirect.** `render.yaml`
führt beim Deploy `prisma migrate deploy` aus; Health-Check `GET /api/health`.

---

## Fallstricke (real, kein Bug)

- **Tailwind v4** wird über `scripts/build-styles.mjs` gebaut (`npm run styles:build|watch`), nicht über die CLI —
  vor dem ersten Frontend-Serve einmal `styles:build` laufen lassen.
- **Supabase `DATABASE_URL` = Session-Pooler** (Port 5432, Host endet auf `pooler.supabase.com`). NICHT Direct
  (IPv6-only → Render `ENETUNREACH`), NICHT Transaction-Pooler (6543, Migrationen scheitern).
- **CI nutzt `npm install`, nicht `npm ci`** (unter Windows erzeugte `package-lock.json` ist nicht streng deckungsgleich).
- **Node 22** überall gleich (lokal/CI/Render).
- **Render Free** schläft nach ~15 Min → Cold Start ~1 Min (erster Login nach Leerlauf kann scheitern → erneut).

---

## Verweise

- **Skill:** `nx-angular-nestjs-ddd-starter` (`.claude/skills/`) — vollständige Bau-/Erweiterungs-Rezepte.
- **ADRs:** `docs/adr/` — Grundentscheidungen aus dem Muster übernehmen und als ADR festhalten (u. a. Modular Monolith,
  CQRS, Cookie-JWT + Refresh). Die Liste wächst mit jeder Architektur-/Setup-Entscheidung.
- **Deployment:** `docs/DEPLOYMENT.md`. **Prisma-Schema:** `libs/backend/shared/database/prisma/schema.prisma`.
