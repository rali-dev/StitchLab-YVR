# ADR-0006: Geld als ganzzahlige Cent

- **Status:** akzeptiert
- **Datum:** 2026-07-28 (nachträglich dokumentiert; umgesetzt in Datenmodell und Product-Domäne)

## Kontext

Preise sind der einzige Wert im Shop, bei dem ein Rundungsfehler direkt Geld kostet.
JavaScript-Zahlen sind Fließkommazahlen: `0.1 + 0.2 === 0.30000000000000004`. Ein Warenkorb, der
zehn Positionen summiert, verschiebt sich damit irgendwann um einen Cent — und ein Betrag, der um
einen Cent von der Rechnung abweicht, ist ein echter Fehler, kein Schönheitsfehler.

## Entscheidung

Geld wird im **gesamten Stack** als ganzzahlige Cent geführt:

- Datenbank: `priceCents Int` (kein `Float`, kein `Decimal`),
- Domäne: Value Object `Money`, das ausschließlich über `fromCents(...)` entsteht und
  Nicht-Ganzzahlen, negative Werte und unplausibel große Beträge ablehnt,
- Vertrag: `priceCents: number` mit `@IsInt()`,
- Formatierung als „$49.99" passiert **erst in der Anzeige**.

## Konsequenzen

**Positiv**

- Summen und Vergleiche sind exakt. Ganzzahlen bis 2^53 sind in JavaScript verlustfrei — für
  Centbeträge weit jenseits jedes realistischen Warenkorbs.
- Die Prüfung liegt an einer Stelle. Ein Preis kann die Domäne nicht als `49.99` betreten.
- Das Feld heißt `priceCents` und nicht `price` — die Einheit steht im Namen und kann nicht
  versehentlich als Dollar gelesen werden.

**Negativ**

- Jede Ein- und Ausgabe braucht eine Umrechnung; das Frontend muss formatieren.
- Ein API-Konsument, der `4999` für Dollar hält, liegt um Faktor 100 daneben. Deshalb der
  sprechende Feldname.
- Mehrere Währungen sind damit noch nicht abgedeckt — `Money` trägt heute keine Währung. Käme das
  dazu, wäre es eine Erweiterung des Value Objects, kein Umbau des Datenmodells.

## Alternativen

- **`Decimal` in Postgres:** Exakt, aber Prisma liefert es als `Decimal`-Objekt, das über JSON
  wieder zum String wird — mehr Sonderfälle an jeder Grenze, ohne Gewinn gegenüber Integer-Cent.
- **`Float`:** Verworfen, siehe Kontext.
