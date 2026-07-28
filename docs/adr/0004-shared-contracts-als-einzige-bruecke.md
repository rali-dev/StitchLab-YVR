# ADR-0004: `shared-contracts` als einzige Brücke Frontend↔Backend

- **Status:** akzeptiert
- **Datum:** 2026-07-28 (nachträglich dokumentiert)

## Kontext

Frontend und Backend müssen sich über die Form der Daten einig sein. In getrennten Welten führt
das zu handgepflegten TypeScript-Interfaces im Frontend, die irgendwann von der Realität
abweichen — meist unbemerkt, bis ein Feld umbenannt wird.

## Entscheidung

Eine einzige Bibliothek `libs/shared/contracts` mit dem Tag `platform:universal` enthält alles,
was **beide** Seiten kennen müssen:

- **Eingehende DTOs** als Klassen mit `class-validator`-Decoratoren (`CreateProductDto`),
- **ausgehende DTOs** als Interfaces (`ProductDto`),
- gemeinsame Grenzwerte (`PRODUCT_NAME_MAX_LENGTH`, `PRODUCT_SLUG_PATTERN`),
- das Fehler-Vokabular (siehe [ADR-0005](0005-domaenenfehler-statt-http-exceptions.md)).

Frontend und Backend importieren **nie direkt voneinander** — das erzwingen die
`platform:`-Constraints in ESLint.

Zwei Regeln, die aus der Praxis stammen:

1. **Grenzwerte stehen genau einmal hier** und werden von DTO *und* Entity benutzt. Sonst
   akzeptiert die eine Schicht, was die andere ablehnt.
2. **Keine `@Transform`/`@Type`-Decorators aus `class-transformer`** in dieser Bibliothek.
   `class-transformer` hält seinen Metadaten-Speicher modul-lokal; wird das Paket im Monorepo
   zweimal geladen (Workspace-Symlink, oder Bundler nimmt `esm5` während NestJS `cjs` lädt),
   entstehen zwei Speicher und der Transform greift **stumm** nicht. Reine
   `class-validator`-Decorators sind unbedenklich — die legen ihren Speicher auf `globalThis`.

## Konsequenzen

**Positiv**

- Der Vertrag ist an einer Stelle definiert und wird vom Compiler auf beiden Seiten geprüft.
- Validierungsregeln existieren einmal statt doppelt.
- Ausgehende DTOs sind bewusst **nicht** die Prisma-Zeilen: Ein Spaltenname darf sich ändern,
  ohne das Frontend zu brechen.

**Negativ**

- Die Bibliothek ist ein Nadelöhr — jede Vertragsänderung berührt sie, und beide Seiten bauen neu.
- Sie muss framework-frei bleiben. Bequemlichkeiten wie `PartialType` aus `@nestjs/mapped-types`
  sind verboten, weil das Angular-Frontend sonst NestJS mitzöge; `UpdateProductDto` ist deshalb
  ausgeschrieben.
- Die `@Transform`-Regel oben ist eine Einschränkung, die man sich merken muss — sie wird nicht
  von einem Werkzeug erzwungen, sondern nur von einem Kommentar im DTO.

## Alternativen

- **Generierung aus OpenAPI:** Interessant, aber ein zusätzlicher Generierungsschritt und ein
  Artefakt, das synchron gehalten werden muss. Bleibt eine Option, falls externe Clients dazukommen.
- **Interfaces im Frontend von Hand pflegen:** Verworfen — genau der Zustand, der still
  auseinanderläuft.
