# ADR-0005: Domänenfehler statt HTTP-Exceptions + globaler Filter

- **Status:** akzeptiert
- **Datum:** 2026-07-28 (nachträglich dokumentiert; umgesetzt mit der Product-Domäne)

## Kontext

Der bequeme NestJS-Weg ist, in der Geschäftslogik direkt `throw new NotFoundException(...)` zu
schreiben. Damit wandert HTTP-Wissen in Schichten, die von HTTP nichts wissen dürfen — und die
Regel aus [ADR-0002](0002-vier-schichten-je-domaene.md) („`domain` ist rein") wäre schon beim
ersten Fehlerfall verletzt.

## Entscheidung

Ein kleines, framework-freies Fehler-Vokabular in `shared-contracts`:

| Klasse | Bedeutung | HTTP |
|---|---|---|
| `DomainException` | verletzte Geschäftsregel | 400 |
| `ResourceNotFoundException` | Ressource existiert nicht | 404 |
| `ResourceConflictException` | Kollision mit dem Bestand (z. B. belegter Slug) | 409 |

Die beiden Spezialfälle erben von `DomainException`. Die Übersetzung nach HTTP macht **ein**
`DomainExceptionFilter` in `apps/backend`, registriert über `APP_FILTER` (nicht in `main.ts`
instanziiert, weil er den `HttpAdapterHost` per Dependency Injection braucht).

Namensgebung mit dem Präfix `Resource…`, um Verwechslung mit NestJS' gleichnamigen
`NotFoundException`/`ConflictException` auszuschließen.

## Konsequenzen

**Positiv**

- Entity und Handler bleiben frei von HTTP. Eine Regel wie „ein Schaufenster-Produkt muss
  veröffentlicht sein" gilt auch im Seed-Skript, wo es keinen Statuscode gibt.
- Die Zuordnung Fehler→Status steht an **einer** Stelle und ist dort testbar.
- Der Filter gilt automatisch für jede künftige Domäne — er liegt in der App, nicht in einer
  Domänen-Bibliothek.

**Negativ**

- Ein zusätzlicher Übersetzungsschritt gegenüber dem direkten Wurf einer HTTP-Exception.
- Die Reihenfolge der `instanceof`-Prüfungen im Filter ist bedeutsam: Beide Spezialfälle erben von
  `DomainException` und würden sonst als 400 enden. Dafür gibt es einen eigenen Test.
- Wer 403 oder 422 braucht, muss das Vokabular erweitern — bewusst klein gehalten, statt auf
  Vorrat zu bauen.

## Alternativen

- **NestJS-Exceptions überall:** Verworfen, siehe Kontext.
- **Fehlercodes statt Klassen** (`{ code: 'PRODUCT_NOT_FOUND' }`): Verworfen. Klassen erlauben
  `instanceof` und lassen sich vom Compiler prüfen; ein String-Code ist ein Tippfehler in
  Wartestellung.
