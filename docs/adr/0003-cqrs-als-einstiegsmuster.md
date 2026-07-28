# ADR-0003: CQRS über Command-/QueryBus statt Services

- **Status:** akzeptiert
- **Datum:** 2026-07-28 (nachträglich dokumentiert; erstmals umgesetzt mit der Product-Domäne)

## Kontext

Der übliche NestJS-Weg ist ein `ProductService`, den der Controller injiziert. Solche Services
wachsen erfahrungsgemäß zu Sammelstellen: nach einem Jahr stehen dort zwanzig Methoden, von denen
die Hälfte nur von einer Stelle benutzt wird, und niemand traut sich mehr, eine zu ändern.

## Entscheidung

Controller sprechen ausschließlich mit `CommandBus` und `QueryBus` (`@nestjs/cqrs`).
**Ein Command = eine Absicht = ein Handler.**

- **Commands** ändern Zustand (`CreateProductCommand`).
- **Queries** lesen nur (`ListProductsQuery`).
- Handler geben **DTOs** zurück, keine Entities — die Übersetzung passiert im Mapper der
  Application-Schicht.

Genutzt werden die generischen Basisklassen `Command<T>` / `Query<T>`, damit
`commandBus.execute(...)` seinen Rückgabetyp kennt.

## Konsequenzen

**Positiv**

- Jeder Anwendungsfall ist eine eigene Datei mit einem einzigen öffentlichen Einstiegspunkt.
  „Was passiert beim Anlegen eines Produkts?" hat genau eine Antwortdatei.
- Ein Command ist unabhängig vom Auslöser. Derselbe `CreateProductCommand` kann von HTTP, einem
  Seed-Skript oder einem Import-Job kommen — ohne dass ein DTO gebaut werden muss.
- Querschnittsthemen (Logging, Transaktionen) lassen sich am Bus ansetzen statt in jeder Methode.
- Der Bus entkoppelt Lesen und Schreiben so weit, dass eine getrennte Leseseite später möglich
  bleibt, ohne dass sie heute gebaut werden muss.

**Negativ**

- Mehr Zeremonie: Für einen simplen Lesezugriff entstehen Query-Klasse, Handler und Registrierung
  — drei Stellen statt einer Service-Methode.
- Die Verdrahtung ist zur Laufzeit, nicht zur Compile-Zeit. Ein nicht registrierter Handler fällt
  erst beim Aufruf auf. Gegenmittel: Der Controller-Test prüft die Bus-Verdrahtung.
- Wer NestJS kennt, aber CQRS nicht, braucht eine Einführung.

## Alternativen

- **Klassische Services:** Verworfen, siehe Kontext. Für ein Lernprojekt kommt hinzu, dass CQRS
  genau die Trennung sichtbar macht, um die es beim Üben geht.
- **Event Sourcing:** Verworfen. CQRS ist unabhängig davon; Event Sourcing würde Zustandsaufbau
  aus Ereignissen bedeuten und ist für einen Shop dieser Größe massiv überzogen.
  Domänen-Ereignisse werden trotzdem publiziert (`ProductCreatedEvent`) — als Benachrichtigung,
  nicht als Quelle der Wahrheit.
