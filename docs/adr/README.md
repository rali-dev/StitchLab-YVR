# Architecture Decision Records (ADR)

Hier steht, **warum** dieses Projekt so gebaut ist, wie es gebaut ist — nicht, wie es
funktioniert (das steht im Code und in `CLAUDE.md`).

Ein ADR wird geschrieben, wenn eine Entscheidung **schwer zurückzunehmen** ist oder wenn ein
Außenstehender sich später fragen würde „warum haben die das so gemacht?". Faustregel: Wenn die
Antwort auf diese Frage nur in einem Kopf existiert, gehört sie hierher.

## Regeln

- **Ein ADR = eine Entscheidung.** Fortlaufend nummeriert, Nummern werden nie neu vergeben.
- **ADRs werden nicht gelöscht und nicht umgeschrieben.** Ändert sich eine Entscheidung, entsteht
  ein neues ADR, das das alte ersetzt; das alte bekommt den Status `abgelöst durch ADR-XXXX`.
  Der Irrweg ist Teil der Dokumentation — er verhindert, dass jemand ihn erneut geht.
- **Status:** `vorgeschlagen` · `akzeptiert` · `abgelöst durch ADR-XXXX` · `verworfen`.

## Liste

| Nr. | Entscheidung | Status |
|---|---|---|
| [0001](0001-modular-monolith-im-nx-monorepo.md) | Modular Monolith in einem Nx-Monorepo | akzeptiert |
| [0002](0002-vier-schichten-je-domaene.md) | Vier Schichten je Domäne, per ESLint erzwungen | akzeptiert |
| [0003](0003-cqrs-als-einstiegsmuster.md) | CQRS über Command-/QueryBus statt Services | akzeptiert |
| [0004](0004-shared-contracts-als-einzige-bruecke.md) | `shared-contracts` als einzige Brücke Frontend↔Backend | akzeptiert |
| [0005](0005-domaenenfehler-statt-http-exceptions.md) | Domänenfehler statt HTTP-Exceptions + globaler Filter | akzeptiert |
| [0006](0006-geld-als-integer-cent.md) | Geld als ganzzahlige Cent | akzeptiert |
| [0007](0007-jwt-in-httponly-cookies.md) | JWT (Access + Refresh) in HttpOnly-Cookies | akzeptiert |
