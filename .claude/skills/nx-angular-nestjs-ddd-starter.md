---
name: nx-angular-nestjs-ddd-starter
description: >-
  Blueprint zum Aufbauen UND Erweitern eines Fullstack-Projekts im exakten Stil des Iranian-Oral-History-Projekts:
  NX-Monorepo (Modular Monolith), TypeScript, NestJS + CQRS + DDD/Clean Architecture im Backend, Angular + Tailwind v4
  im Frontend, Prisma + PostgreSQL (Supabase), JWT/Passport mit Access- + Refresh-Token in HttpOnly-Cookies,
  class-validator, Jest (Unit) + Playwright (E2E), GitHub-Actions-CI (nx affected) und Deployment auf Vercel + Render + Supabase.
  BENUTZEN wenn: ein neues Projekt in diesem Stack initialisiert wird ("ddd nx init", "neues Monorepo"), eine neue
  Backend-Domäne (domain/application/infrastructure/adapters) angelegt wird, ein neues Angular-Feature entsteht, Auth
  eingebaut wird, Tests/CI/Deployment aufgesetzt werden — oder immer wenn Architektur-Grenzen (Tags, Layer, Imports)
  eine Rolle spielen.
---

# Fullstack NX + DDD Starter (Iranian-Oral-History-Stil)

Dieses Skill ist die destillierte Bauanleitung eines produktiven Fullstack-Monorepos. Ziel: dieselben Werkzeuge,
Muster und Architekturentscheidungen in einem **neuen** Projekt reproduzieren — nicht kopieren, sondern verstanden
neu aufbauen. Wenn der Nutzer lernt, erkläre das **Warum** hinter jeder Schicht, nicht nur das Wie.

---

## 0. Stack (bewährte Versionen)

| Bereich | Technologie |
|---|---|
| Monorepo | **Nx 22.7.x** (`@nx/angular`, `@nx/nest`, `@nx/jest`, `@nx/playwright`, `@nx/eslint`) |
| Sprache | **TypeScript ~5.9**, **Node 22** |
| Backend | **NestJS 11**, `@nestjs/cqrs`, `@nestjs/config`, `@nestjs/throttler`, `helmet` |
| DB / ORM | **PostgreSQL** + **Prisma 7** (`@prisma/client`, `@prisma/adapter-pg`, `pg`) |
| Auth | `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`, `bcrypt`, `cookie-parser` |
| Validierung | `class-validator`, `class-transformer` |
| Storage / Mail | **Supabase** (`@supabase/supabase-js`, Signed URLs), **Resend** (Mail) |
| Frontend | **Angular 21** (standalone, Signals), **Tailwind CSS v4** (`@tailwindcss/postcss`), `gsap` |
| Tests | **Jest 30** (Unit/Integration), **Playwright** (E2E) |
| CI/CD | **GitHub Actions** (`nx affected`), **Vercel** (FE), **Render** (BE), **Supabase** (DB+Storage) |

**Node 22 überall gleich halten** (lokal, CI, Render) — Angular-21-Toolchain verlangt `^20.19 || ^22.12 || ^24`.

---

## 1. Nicht verhandelbare Grundregeln (Golden Rules)

1. **Clean Architecture je Domäne, vier Schichten:** `domain → application → infrastructure`, plus `adapters` als
   HTTP-Rand. Abhängigkeiten zeigen **immer nach innen** (Dependency Rule). Diese Regel wird von ESLint
   **hart erzwungen** (Abschnitt 4) — nicht per Disziplin, sondern per Build-Fehler.
2. **Domäne ist rein:** kein NestJS, kein Prisma, kein HTTP im `domain`-Layer. Nur TS + `shared-contracts`.
3. **Invarianten in der Entity, nicht im DTO.** Der Schreibpfad läuft durch eine statische Factory
   (`Entity.create(...)`) bzw. `Entity.assertValidUpdate(...)`. Das Repository persistiert **aus der Entity**, nie aus
   dem rohen DTO — so kann kein Write die Regeln umgehen.
4. **CQRS:** Controller rufen `CommandBus`/`QueryBus`, nie Services direkt. Ein Command = eine Absicht, ein Handler.
5. **Repository-Interface + Symbol-Token wohnen in `domain`.** Die Prisma-Implementierung wohnt in `infrastructure`
   und wird per DI-Token gebunden (Dependency Inversion).
6. **Contracts sind die einzige Brücke** zwischen Frontend und Backend: DTOs, Interfaces, Enums, `DomainException`
   liegen in `libs/shared/contracts` (`platform:universal`). Frontend und Backend importieren **nie** direkt voneinander.
7. **Jede Public-Regel hat einen Test.** Handler mocken das Repo-Interface; Entities testen ihre Invarianten;
   Controller testen Guard-/Bus-Verdrahtung.
8. **Kommentare erklären WARUM, nicht WAS** — besonders bei Sicherheits-/Grenzfall-Entscheidungen.

---

## 2. Namens- und Ordnungs-Konventionen

**Workspace-Scope:** `@<workspace>` (z. B. `@myapp`). Jede Lib hat einen import-Alias in `tsconfig.base.json`.

```
apps/
  backend/                 # NestJS-App: nur Bootstrap + AppModule-Komposition
  frontend/                # Angular-App: nur Shell/Router
  backend-e2e/             # Playwright/HTTP-E2E gegen die laufende API
  frontend-e2e/            # Playwright-E2E gegen die laufende SPA
libs/
  shared/
    contracts/             # @myapp/shared-contracts   (platform:universal) — DTOs, Interfaces, Enums, DomainException
  backend/
    <domain>/
      domain/              # @myapp/backend-<domain>-domain          (scope:domain,         platform:backend)
      application/         # @myapp/backend-<domain>-application      (scope:application,    platform:backend)
      infrastructure/      # @myapp/backend-<domain>-infrastructure   (scope:infrastructure, platform:backend)
      adapters/            # @myapp/backend-<domain>-adapters         (scope:adapters,       platform:backend)
    shared/
      database/            # @myapp/backend-shared-database   PrismaService + schema.prisma  (scope:shared)
      auth-infra/          # @myapp/backend-shared-auth-infra Guards/Strategies/Decorators   (scope:shared)
      storage/             # @myapp/backend-shared-storage    Supabase Signed URLs           (scope:shared)
      application/         # @myapp/backend-shared-application Querschnitt (z. B. Unit-of-Work) (scope:shared)
  frontend/
    <domain>/
      data-access/         # @myapp/frontend-<domain>-data-access  HTTP-Services/State  (scope:data-access, platform:frontend)
      feature-<x>/         # @myapp/frontend-<domain>-feature-<x>  Smart Components     (scope:feature,     platform:frontend)
    shared/
      ui/                  # dumme, wiederverwendbare Components/Tokens  (scope:feature/ui)
      i18n/                # de/en/fa Übersetzungen (RTL für fa)
      utils/               # reine Helfer
```

Domänen-Zuschnitt am fachlichen Kern orientieren (Beispiel-Domänen im Referenzprojekt: `identity`, `video`,
`collection`, `favorite`). Eine Domäne = ein Aggregat + seine Use-Cases.

---

## 3. Nx-Tags — das Rückgrat der Architektur

Jede `project.json` bekommt genau zwei Tag-Achsen:

```jsonc
// libs/backend/<domain>/domain/project.json
{ "tags": ["scope:domain", "platform:backend"] }
```

- **scope:** `domain` | `application` | `infrastructure` | `adapters` | `shared` | `feature` | `data-access`
- **platform:** `backend` | `frontend` | `universal` (nur `shared-contracts` ist `universal`)

---

## 4. Modulgrenzen erzwingen (`eslint.config.mjs`)

Dies ist die maschinell erzwungene Clean Architecture. Genau so übernehmen — **Verstöße sind Lint-Fehler und brechen die CI:**

```js
'@nx/enforce-module-boundaries': ['error', {
  enforceBuildableLibDependency: true,
  allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
  depConstraints: [
    // ── Backend: Clean-Architecture-Schichten ──
    { sourceTag: 'scope:domain',         onlyDependOnLibsWithTags: ['scope:domain', 'scope:shared'] },
    { sourceTag: 'scope:infrastructure', onlyDependOnLibsWithTags: ['scope:infrastructure', 'scope:domain', 'scope:shared'] },
    { sourceTag: 'scope:application',    onlyDependOnLibsWithTags: ['scope:application', 'scope:domain', 'scope:shared'] },
    { sourceTag: 'scope:adapters',       onlyDependOnLibsWithTags: ['scope:adapters', 'scope:application', 'scope:domain', 'scope:shared'] },
    { sourceTag: 'scope:shared',         onlyDependOnLibsWithTags: ['scope:shared', 'scope:domain'] },
    // ── Frontend ──
    { sourceTag: 'scope:feature',        onlyDependOnLibsWithTags: ['scope:feature', 'scope:domain', 'scope:shared', 'scope:data-access'] },
    { sourceTag: 'scope:data-access',    onlyDependOnLibsWithTags: ['scope:data-access', 'scope:domain', 'scope:shared'] },
    // ── Platform-Trennung ──
    { sourceTag: 'platform:frontend',    onlyDependOnLibsWithTags: ['platform:frontend', 'platform:universal'] },
    { sourceTag: 'platform:backend',     onlyDependOnLibsWithTags: ['platform:backend', 'platform:universal'] },
  ],
}]
```

Merksatz: **`application` darf `infrastructure` NICHT importieren** (Handler kennen nur Domain-Interfaces).
**`adapters` importiert `application` + `domain`**, aber nie `infrastructure` direkt.

---

## 5. Bootstrap — vom leeren Repo zur laufenden App

```bash
npx create-nx-workspace@22 <workspace> --preset=apps --packageManager=npm
cd <workspace>
npm i -D @nx/angular @nx/nest @nx/jest @nx/playwright @nx/eslint @nx/eslint-plugin @nx/webpack \
        prisma jest jest-preset-angular @playwright/test typescript-eslint prettier
npm i @nestjs/common @nestjs/core @nestjs/config @nestjs/cqrs @nestjs/jwt @nestjs/passport \
      @nestjs/throttler passport passport-jwt bcrypt cookie-parser helmet class-validator class-transformer \
      @prisma/client @prisma/adapter-pg pg @supabase/supabase-js resend

npx nx g @nx/nest:app apps/backend
npx nx g @nx/angular:app apps/frontend --style=scss --unitTestRunner=jest --e2eTestRunner=playwright
npx nx g @nx/js:lib libs/shared/contracts --tags=scope:shared,platform:universal
```

Dann in `nx.json` die Generator-Defaults + `defaultBase: "main"` + Plugins (webpack/eslint/playwright) setzen und die
Modulgrenzen aus Abschnitt 4 in `eslint.config.mjs` eintragen. Danach die erste Domäne (Abschnitt 6).

**Backend-Bootstrap-Härtung** (`apps/backend/src/main.ts`): globales `ValidationPipe({ whitelist:true, transform:true })`,
`helmet()`, `cookieParser()`, globales Prefix `/api`, CORS aus `CORS_ORIGINS`, Health-Endpoint `GET /api/health`
(prüft DB), Graceful Shutdown. **`JWT_SECRET`/`JWT_REFRESH_SECRET` beim Boot über `config.getOrThrow` erzwingen** —
fehlt/zu schwach → Prozess bricht bewusst ab.

---

## 6. Rezept: neue Backend-Domäne (die vier Schichten)

```bash
D=<domain>
npx nx g @nx/js:lib   libs/backend/$D/domain         --tags=scope:domain,platform:backend
npx nx g @nx/js:lib   libs/backend/$D/application     --tags=scope:application,platform:backend
npx nx g @nx/js:lib   libs/backend/$D/infrastructure  --tags=scope:infrastructure,platform:backend
npx nx g @nx/nest:lib libs/backend/$D/adapters        --tags=scope:adapters,platform:backend
```

### 6a. `domain` — Entity mit Invarianten + Repository-Port

```ts
// entities/<name>.entity.ts  — rein, kein Framework
import { DomainException } from '@myapp/shared-contracts';

export class FooEntity {
  constructor(
    public readonly id: string,
    public readonly slug: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /** Factory für eine NEUE (noch nicht persistierte) Entity: erzwingt Invarianten VOR dem Schreiben. */
  static create(input: CreateFooInput): FooEntity {
    const slug = input.slug.trim();
    if (slug.length === 0) throw new DomainException('slug must not be empty.');
    const now = new Date();
    return new FooEntity('', slug, now, now); // id/Timestamps vergibt die DB
  }

  /** Validiert einen Partial-Patch VOR dem Schreiben (Partial-Update-Semantik bleibt erhalten). */
  static assertValidUpdate(patch: UpdateFooInput): void {
    if (patch.slug !== undefined && patch.slug.trim().length === 0)
      throw new DomainException('slug must not be blank.');
  }
}
```

```ts
// repositories/foo-repository.interface.ts
export interface CreateFooInput { slug: string; }
export interface UpdateFooInput { slug?: string; }
export interface IFooRepository {
  findAll(): Promise<FooEntity[]>;
  findBySlug(slug: string): Promise<FooEntity | null>;
  create(data: CreateFooInput): Promise<FooEntity>;
  update(id: string, data: UpdateFooInput): Promise<FooEntity>;
  delete(id: string): Promise<void>;
}
export const FOO_REPOSITORY = Symbol('FOO_REPOSITORY'); // DI-Token
```

### 6b. `application` — CQRS Command/Query + Handler

```ts
// commands/create-foo.command.ts
export class CreateFooCommand { constructor(public readonly dto: CreateFooDto) {} }

// commands/create-foo.handler.ts
@Injectable()
@CommandHandler(CreateFooCommand)
export class CreateFooHandler implements ICommandHandler<CreateFooCommand, FooEntity> {
  constructor(@Inject(FOO_REPOSITORY) private readonly repo: IFooRepository) {}
  execute({ dto }: CreateFooCommand) { return this.repo.create({ slug: dto.slug }); }
}
```

Handler kennt **nur** das Domain-Interface + Token. Nie Prisma, nie HTTP.

### 6c. `infrastructure` — Prisma-Implementierung (Write-Pfad durch die Domäne)

```ts
@Injectable()
export class PrismaFooRepository implements IFooRepository {
  constructor(private readonly prisma: PrismaService) {}
  async create(data: CreateFooInput): Promise<FooEntity> {
    const draft = FooEntity.create(data);                 // Invarianten + Normalisierung ZUERST
    const row = await this.prisma.foo.create({ data: { slug: draft.slug } });
    return this.toEntity(row);
  }
  async update(id: string, data: UpdateFooInput): Promise<FooEntity> {
    FooEntity.assertValidUpdate(data);                    // auch der Patch-Pfad
    const row = await this.prisma.foo.update({ where: { id }, data: { ...(data.slug !== undefined && { slug: data.slug.trim() }) } });
    return this.toEntity(row);
  }
  private toEntity(r): FooEntity { return new FooEntity(r.id, r.slug, r.createdAt, r.updatedAt); }
}
```

Infrastructure-Modul bindet Interface → Implementierung:
```ts
{ provide: FOO_REPOSITORY, useClass: PrismaFooRepository }
```

### 6d. `adapters` — Controller ruft Bus, Guards schützen Writes

```ts
@Controller('foos')
export class FooController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

  @Get() findAll() { return this.queryBus.execute(new GetAllFoosQuery()); }

  @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMIN')
  @Post() create(@Body() dto: CreateFooDto) { return this.commandBus.execute(new CreateFooCommand(dto)); }
}
```

### 6e. Verdrahtung im `AppModule`

`CqrsModule` importieren; je Domäne das Adapters-Modul (registriert Controller + Handler) und das Infrastructure-Modul
(bindet Repository-Tokens) importieren. `DomainException` per globalem `ExceptionFilter` auf HTTP 400/409 mappen.

---

## 7. Auth-Rezept (JWT Access + Refresh in HttpOnly-Cookies)

Lebt in `libs/backend/shared/auth-infra` (`scope:shared`):

- **Zwei Passport-Strategien:** `jwt` (Access) und `jwt-refresh` (Refresh) — beide lesen das Token aus einem
  **Cookie**, nicht aus dem `Authorization`-Header:
  ```ts
  jwtFromRequest: ExtractJwt.fromExtractors([(req) => req?.cookies?.['access_token'] ?? null]),
  secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
  ```
- **Getrennte Secrets** `JWT_SECRET` ≠ `JWT_REFRESH_SECRET`, jeweils ≥ 32 Zeichen (`node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"`).
- **Guards:** `JwtAuthGuard`, `JwtRefreshGuard`, `RolesGuard` + `@Roles('ADMIN')`-Decorator (liest Rollen aus dem Payload via `Reflector`).
- **Cookies:** `HttpOnly`, `Secure`, `SameSite=Strict`, **kein `Domain`**. Access kurzlebig, Refresh langlebig; Refresh
  setzt neuen Access. Logout löscht beide Cookies.
- **Passwörter:** `bcrypt` (Hash beim Register, Compare beim Login). Nie Klartext, nie im Log.
- `IJwtPayload` (sub, role, ...) lebt in `shared-contracts`.

> **Warum Cookies + `SameSite=Strict` statt Header-Token?** Kein JS-Zugriff (XSS-resistenter) und der Browser schickt
> das Cookie nur same-origin. Das macht die Deployment-Architektur (Abschnitt 12, Vercel-Rewrite) zwingend.

---

## 8. Contracts (`libs/shared/contracts`)

Die einzige geteilte Sprache. Enthält: DTO-Klassen mit `class-validator`-Decoratoren
(`@IsString`, `@IsEnum`, `@ValidateNested`, ...), Interfaces (`IJwtPayload`, mehrsprachige Value-Objects wie
`IVideoTranslation = { de; en; fa }`), Enums (`CollectionType`, Rollen) und `DomainException`. `platform:universal` —
darf von Backend **und** Frontend importiert werden, importiert selbst nichts Framework-spezifisches.

---

## 9. Datenbank & Prisma

- Schema: `libs/backend/shared/database/prisma/schema.prisma`. `PrismaService extends PrismaClient` (mit
  `@prisma/adapter-pg`) lebt in `backend-shared-database`, `onModuleInit` → `connect`, Graceful Shutdown.
- Skripte (root `package.json`), immer mit explizitem `--schema`:
  ```json
  "db:migrate":  "npx prisma migrate dev --schema=libs/backend/shared/database/prisma/schema.prisma",
  "db:generate": "npx prisma generate --schema=libs/backend/shared/database/prisma/schema.prisma",
  "db:studio":   "node scripts/studio.mjs"
  ```
- Mehrsprachige Felder als Spalten (`nameDe/nameEn/nameFa`), im Repo zu einem Value-Object gemappt.
- **`prisma generate` gehört in Build & CI** (kein DB-Zugriff nötig); `prisma migrate deploy` läuft im Deploy (Abschnitt 12).

---

## 10. Storage (Supabase) & Mail (Resend)

- `backend-shared-storage`: `@supabase/supabase-js` mit **`service_role`-Key** (nur serverseitig, nie ins Frontend/Git),
  privater Bucket, Zugriff ausschließlich über **Signed URLs** mit kurzer Gültigkeit.
- Mail über `resend` (Passwort-Reset o. Ä.); Absenderdomain in Resend verifizieren, sonst landen Mails im Spam.

---

## 11. Frontend (Angular 21 + Tailwind v4)

- **Trennung:** `data-access`-Libs kapseln HTTP (`HttpClient` gegen `/api/...`, `withCredentials`) + State (Signals);
  `feature-*`-Libs sind Smart Components und routen; `shared/ui` sind dumme, wiederverwendbare Components + Design-Tokens.
- **Standalone Components + Signals**, kein NgModule-Boilerplate. Lazy-geroutete Feature-Libs.
- **Tailwind v4** via `@tailwindcss/postcss`; ein Build-Skript (`scripts/build-styles.mjs`, `styles:build`/`styles:watch`).
  Kein SCSS/BEM — Utility-First. Design-Tokens als CSS-Custom-Properties, Dark-Mode per `[data-theme=dark]`-Override
  (ThemeService + Toggle in der globalen Nav).
- **i18n de/en/fa** in `frontend-shared-i18n`; **fa ist RTL** — Richtung/Layout müssen spiegeln. Keine hartcodierten
  Strings in Components.
- **Auth im FE:** nie Token in `localStorage` (Cookies sind HttpOnly); Login/Logout-State aus `/api/auth/me`
  ableiten; HTTP-Interceptor für 401 → Refresh-Versuch → sonst Redirect zum Login.

---

## 12. Deployment (Vercel + Render + Supabase, kostenlos)

**Architektur:** Das Frontend ruft das Backend **nur** relativ als `/api/...` auf. Vercel **rewritet** (kein Redirect!)
`/api/*` an das Render-Backend. Für den Browser ist alles **same-origin** (nur die Vercel-Adresse) — dadurch schickt er
die `SameSite=Strict`-Cookies mit. Direkter Aufruf von `onrender.com` = andere Origin = Cookie verworfen = Login 200,
dann 401. **Es MUSS ein Rewrite sein.**

`vercel.json` (Repo-Root):
```json
{
  "framework": null,
  "buildCommand": "npx nx build frontend --configuration=production",
  "outputDirectory": "dist/apps/frontend/browser",
  "installCommand": "npm install",
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://YOUR-BACKEND.onrender.com/api/:path*" },
    { "source": "/(.*)",       "destination": "/index.html" }
  ]
}
```
Die `/api`-Regel MUSS vor dem Catch-all stehen. Output ist der **`browser`-Unterordner**.

`render.yaml` (Repo-Root): Web-Service, `plan: free`, `healthCheckPath: /api/health`,
Build = `npm ci && prisma generate && nx build backend && prisma migrate deploy`,
Start = `node dist/apps/backend/main.js`. Alle Secrets als `sync: false`.

**Supabase-Fallstricke:**
- **Session-Pooler** als `DATABASE_URL` (Port **5432**, Host endet auf `pooler.supabase.com`). NICHT Direct
  (IPv6-only, für Render unerreichbar → `ENETUNREACH`), NICHT Transaction-Pooler (6543, Migrationen scheitern).
- Reihenfolge: **GitHub → Supabase → Render → Vercel → CORS nachtragen → E2E-Check**.
- Free-Tier: Render schläft nach ~15 Min → Cold Start ~1 Min (erster Login nach Leerlauf kann scheitern → erneut).

---

## 13. Tests

- **Jest (Unit/Integration), colokiert als `*.spec.ts`**, je Lib eine `jest.config.cts`, Root-`jest.preset`.
  - **Handler-Test:** Repo-Interface als `jest.fn()`-Mock, Handler direkt instanziieren, `toHaveBeenCalledWith` prüfen.
  - **Entity-Test:** jede Invariante (leerer Slug, ungültiger Typ, Blank-Name) → `DomainException`.
  - **Controller-Test:** Bus-Verdrahtung + Guards.
- **Playwright E2E** in `apps/frontend-e2e` und `apps/backend-e2e` — brauchen echte DB/Secrets/laufende App.
- **Ausführen:** `npx nx affected -t test` (Unit), `npx nx e2e frontend-e2e` (E2E). `passWithNoTests: true`.

---

## 14. CI (GitHub Actions)

`.github/workflows/ci.yml` — läuft bei Push/PR auf `main`, nur **affected**, ohne DB/Secrets/Browser:

```yaml
concurrency: { group: ci-${{ github.workflow }}-${{ github.ref }}, cancel-in-progress: true }
permissions: { contents: read, actions: read }
# checkout fetch-depth:0 → setup-node@22 (cache:npm) → npm install --include=dev → npm run db:generate
#   → nrwl/nx-set-shas@v4 → nx affected -t lint → nx affected -t test → nx affected -t build
```

- `npm install`, **nicht `npm ci`** (unter Windows erzeugte `package-lock.json` ist nicht streng deckungsgleich).
- `nx-set-shas` ermittelt die Diff-Basis; `fetch-depth: 0` ist Pflicht.
- **E2E bewusst NICHT im schnellen Gate** — eigener, späterer Workflow.

---

## 15. Definition of Done (jede Änderung)

- [ ] `npx nx affected -t lint test build` grün (inkl. Modulgrenzen).
- [ ] Neue Domänen-Regel? → Test dafür. Neue Route? → Guard geprüft.
- [ ] Keine Secrets im Code/Repo; `.env` in `.gitignore`; Pflicht-Env per `getOrThrow`.
- [ ] Contracts-DTO + `class-validator` für jeden neuen Input.
- [ ] README/ADR aktualisiert, wenn sich Architektur/Setup ändert.

---

## 16. So treibst du das mit Claude (Arbeitsweise)

- **Plan-Mode** für alles Nicht-Triviale: erst Plan bestätigen, dann bauen.
- **Skills gezielt einsetzen:** dieses Skill fürs Gerüst; separate Skills für Design/i18n falls vorhanden.
- **Nach jeder nicht-trivialen Änderung:** `/code-review` (Bugs) und bei Verhalten das `verify`-Skill (real ausführen,
  nicht nur Tests).
- **Subagenten/Explore** für breite Recherche; die Hauptsitzung trifft Entscheidungen.
- **Adversariale Prüfung** vor „fertig": Tests grün ≠ korrekt — Randfälle bewusst gegenlesen.
