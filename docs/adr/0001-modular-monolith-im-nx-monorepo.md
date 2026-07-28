# ADR-0001: Modular Monolith in einem Nx-Monorepo

- **Status:** akzeptiert
- **Datum:** 2026-07-28 (nachträglich dokumentiert; Entscheidung fiel beim Bootstrap)

## Kontext

StitchLab-YVR ist ein Shop mit Schaufenster für ein Stickerei-Studio. Frontend (Angular) und
Backend (NestJS) müssen dieselben Datenverträge kennen. Das Projekt wird von **einer Person**
entwickelt und dient zugleich als Portfolio-Arbeit.

Zur Wahl standen: getrennte Repositories je App, ein Monorepo mit einem Deployment, oder
Microservices.

## Entscheidung

**Ein Nx-Monorepo mit einem deploybaren Backend** („Modular Monolith"): fachliche Trennung über
Bibliotheken und erzwungene Modulgrenzen, aber **ein** Prozess, **eine** Datenbank, **ein**
Deployment.

## Konsequenzen

**Positiv**

- Eine Änderung an einem Datenvertrag lässt sich in *einem* Commit über Frontend und Backend
  ziehen — kein Versions-Tanz zwischen Repos.
- Nx erkennt über den Abhängigkeitsgraphen, was von einer Änderung betroffen ist
  (`nx affected`) — der Monolith bleibt trotz Größe schnell zu prüfen.
- Die Modulgrenzen sind trotzdem hart (siehe [ADR-0002](0002-vier-schichten-je-domaene.md)).
  Sollte eine Domäne später wirklich ein eigener Dienst werden müssen, ist sie bereits sauber
  geschnitten — der Schnitt ist vorbereitet, nur nicht vollzogen.

**Negativ**

- Alles skaliert gemeinsam. Eine rechenintensive Domäne kann nicht einzeln hochgefahren werden.
- Ein Fehler beim Start legt den ganzen Prozess lahm.
- Das Repository wächst; ohne Nx-Caching würden CI-Läufe mit der Zeit unangenehm.

## Alternativen

- **Microservices:** Verworfen. Sie lösen ein Problem, das dieses Projekt nicht hat
  (unabhängige Skalierung und Deployments mehrerer Teams), und erkaufen das mit verteilten
  Transaktionen, Netzwerkfehlern und mehrfacher Infrastruktur. Für einen einzelnen Entwickler ist
  das reiner Aufwand ohne Gegenwert.
- **Getrennte Repos für Frontend und Backend:** Verworfen. Jede Vertragsänderung würde zwei
  Pull Requests und eine Paket-Veröffentlichung brauchen.
