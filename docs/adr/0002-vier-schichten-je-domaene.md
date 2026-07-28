# ADR-0002: Vier Schichten je Domäne, per ESLint erzwungen

- **Status:** akzeptiert
- **Datum:** 2026-07-28 (nachträglich dokumentiert; erstmals umgesetzt mit der Product-Domäne)

## Kontext

In einem Monolithen verfallen Schichten still. Niemand entscheidet, dass die Geschäftslogik
Prisma kennen soll — es passiert, weil ein einzelner Import bequem war, und beim nächsten Mal
gibt es schon einen Präzedenzfall. Eine Konvention, die nur in einem Dokument steht, hält dem
nicht stand.

## Entscheidung

Jede Backend-Domäne besteht aus **vier Nx-Bibliotheken**, deren Abhängigkeiten **immer nach
innen** zeigen:

```
adapters → application → domain          infrastructure → domain
(HTTP)      (CQRS-Handler)  (Entities, Ports)   (Prisma-Impl)
```

Erzwungen wird das nicht durch Disziplin, sondern durch `@nx/enforce-module-boundaries` in
`eslint.config.mjs` über zwei Tag-Achsen (`scope:` und `platform:`). **Ein Verstoß bricht
`lint` und damit die CI.**

Die Kernregeln:

- `domain` ist rein: kein NestJS, kein Prisma, kein HTTP. Nur TypeScript und `shared-contracts`.
- `application` importiert **nie** `infrastructure` — es kennt nur den Port (Interface + Symbol-Token).
- `adapters` importiert **nie** `infrastructure` direkt.
- Nur das AppModule kennt beide Seiten und verbindet Token mit Implementierung.

## Konsequenzen

**Positiv**

- Die Geschäftsregeln sind ohne Datenbank testbar — die Handler-Tests der Product-Domäne laufen
  gegen `jest.fn()`-Mocks des Ports und brauchen keine Sekunde Wartezeit.
- Der Austausch der Persistenz ist eine lokale Änderung in *einer* Bibliothek.
- Die Architektur ist überprüfbar statt behauptet: `nx graph` zeigt die tatsächlichen Pfeile.

**Negativ**

- Vier Bibliotheken pro Domäne sind spürbar Overhead — für eine Domäne mit zwei Feldern wäre das
  überzogen. Die Rechtfertigung liegt darin, dass echte Fachlogik entsteht (Invarianten,
  Berechtigungen), nicht in der Tabellengröße.
- Mehr Dateien, mehr Sprünge beim Lesen. Wer nur „wo wird das gespeichert?" sucht, muss den
  Port-Umweg mitdenken.
- Die Grenze kostet gelegentlich Umwege: Guards mussten in `adapters` statt in `infrastructure`
  liegen, weil `adapters` nicht auf `infrastructure` zugreifen darf
  (siehe [ADR-0007](0007-jwt-in-httponly-cookies.md)).

## Alternativen

- **Konvention ohne Werkzeug:** Verworfen. Genau diese Regel wird unter Zeitdruck als Erstes
  gebrochen, und der Bruch fällt erst auf, wenn er überall kopiert wurde.
- **Ein Modul pro Domäne mit internen Ordnern:** Verworfen. Ordner sind keine Grenze — nichts
  hindert einen Import quer durch das Modul, und es gibt keinen Mechanismus, der es meldet.
