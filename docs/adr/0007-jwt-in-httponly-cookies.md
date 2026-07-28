# ADR-0007: JWT (Access + Refresh) in HttpOnly-Cookies

- **Status:** akzeptiert
- **Datum:** 2026-07-28

## Kontext

Der Shop braucht angemeldete Nutzer (Favoriten, Warenkorb) und einen Admin-Bereich. Bis zu dieser
Entscheidung waren die Schreibrouten der Product-Domäne **ungeschützt** — mit `TODO(auth)`
markiert und ausdrücklich nicht deploybar.

Die verbreitetste Anleitung im Netz speichert das Token im `localStorage` und schickt es als
`Authorization: Bearer …`. Das ist bequem und in einem Punkt gefährlich: Auf `localStorage` kommt
**jedes** JavaScript im Dokument. Eine einzige XSS-Lücke — auch in einer Abhängigkeit dritter
Ordnung — reicht, um Tokens auszulesen und zu exfiltrieren.

## Entscheidung

**Beide** Tokens werden ausschließlich in Cookies transportiert:

| | Access | Refresh |
|---|---|---|
| Cookie | `access_token` | `refresh_token` |
| Laufzeit | 15 Minuten | 7 Tage |
| Secret | `JWT_SECRET` | `JWT_REFRESH_SECRET` (**anderer Wert**) |
| Pfad | `/` | `/api/auth` |

Cookie-Attribute: `httpOnly`, `SameSite=Strict`, `Secure` (außerhalb der lokalen Entwicklung),
**kein** `Domain`-Attribut (bleibt damit host-only).

Weitere Festlegungen:

- **Zwei Passport-Strategien** (`jwt`, `jwt-refresh`) lesen das Token aus dem jeweiligen Cookie,
  nie aus einem Header.
- **Refresh-Rotation:** Bei jedem Refresh wird ein neues Refresh-Token ausgegeben und sein
  **SHA-256-Hash** in `User.hashedRefreshToken` abgelegt. Ein bereits benutztes Token ist damit
  wertlos; Logout setzt das Feld auf `null` und beendet die Sitzung serverseitig.
- **Zwei getrennte Hash-Verfahren**, je nach Art des Geheimnisses:
  **bcrypt für Passwörter** (wenig Entropie → der Hash muss absichtlich langsam sein),
  **SHA-256 für Refresh-Tokens** (hohe Entropie → Langsamkeit bringt nichts).
  Der zwingende Grund steht unten unter „Korrektur".
- **Passwörter** mit `bcrypt`. Ein nicht existierender Nutzer und ein falsches Passwort liefern
  **dieselbe** Antwort — sonst wird der Login zum Verzeichnis gültiger E-Mail-Adressen.
- **Secrets werden beim Start erzwungen:** `config.getOrThrow` plus Längenprüfung (≥ 32 Zeichen)
  und die Prüfung, dass beide Secrets verschieden sind. Fehlt oder taugt eines nicht, **bricht der
  Prozess bewusst ab**, statt mit einem Standardwert weiterzulaufen.
- **Guards liegen in `adapters`**, nicht in `infrastructure`: `scope:adapters` darf laut
  [ADR-0002](0002-vier-schichten-je-domaene.md) nicht auf `infrastructure` zugreifen, und der
  ProductController muss den Guard importieren können.

## Konsequenzen

**Positiv**

- Fremdes JavaScript kommt an ein `httpOnly`-Cookie nicht heran — der Diebstahl per XSS ist damit
  ausgeschlossen, nicht nur erschwert.
- `SameSite=Strict` schickt das Cookie bei fremd-initiierten Anfragen gar nicht erst mit und
  erledigt CSRF für diesen Aufbau ohne zusätzliches Token.
- Der kurzlebige Access-Token begrenzt den Schaden eines Lecks auf 15 Minuten; die Rotation macht
  ein abgefangenes Refresh-Token nach einmaliger Nutzung wertlos.
- Sitzungen sind serverseitig beendbar — ohne den Hash in der Datenbank wäre ein ausgegebenes JWT
  bis zum Ablauf gültig, egal was der Nutzer klickt.

**Negativ**

- **`SameSite=Strict` verlangt same-origin.** Frontend und Backend müssen für den Browser unter
  derselben Herkunft liegen; Vercel **rewritet** dafür `/api/*` an das Render-Backend
  (Rewrite, **niemals** Redirect — ein Redirect wechselt die Herkunft und das Cookie bleibt weg).
  Diese Kopplung ist der Preis der Entscheidung.
- Ein externer Client (mobile App, fremder Dienst) kann sich so nicht anmelden. Käme das dazu,
  bräuchte es einen zweiten, getrennten Weg — kein Grund, heute die Websicherheit dafür zu senken.
- Die Rotation kostet pro Refresh einen bcrypt-Vergleich und einen Schreibzugriff.
- Zwei parallele Anfragen mit demselben abgelaufenen Access-Token können beide refreshen wollen;
  die zweite scheitert dann an der Rotation. Für dieses Projekt akzeptiert — das Frontend hält
  die Refresh-Anfrage später in einem einzigen Kanal.

## Alternativen

- **Token im `localStorage` + Bearer-Header:** Verworfen, siehe Kontext. Der übliche Einwand
  („dann eben keine XSS-Lücke haben") verlässt sich auf die Abwesenheit eines Fehlers statt auf
  eine Schutzschicht.
- **Serverseitige Sitzungen (Session-ID + Speicher):** Solide und einfacher zurückzunehmen, braucht
  aber einen geteilten Speicher (Redis), sobald mehr als ein Prozess läuft — zusätzliche
  Infrastruktur, die der kostenlose Stack nicht hergibt.
- **Nur ein langlebiger Access-Token, kein Refresh:** Verworfen. Entweder ist er kurzlebig (dann
  muss man sich ständig neu anmelden) oder langlebig (dann ist ein Leck lange nutzbar und
  serverseitig nicht abschaltbar).
- **Fertiger Dienst (Supabase Auth, Auth0):** Für ein Portfolio-Projekt, dessen Zweck das
  Verstehen von Authentifizierung ist, wäre das Auslagern genau die Lernerfahrung, um die es geht.

## Korrektur (2026-07-28, noch vor dem ersten Deployment)

Die erste Umsetzung hashte das Refresh-Token mit **bcrypt** — derselben Funktion wie für
Passwörter. Beim Durchspielen am laufenden Server fiel auf: **Ein altes Refresh-Token wurde nach
der Rotation weiterhin akzeptiert** (HTTP 200 statt 401). Die Rotation war damit wirkungslos, und
ein abgefangenes Token wäre bis zum Logout nutzbar geblieben.

**Ursache:** bcrypt verarbeitet nur die **ersten 72 Bytes** der Eingabe und ignoriert den Rest
stillschweigend. Ein JWT ist rund 250 Zeichen lang, und alle Tokens desselben Nutzers beginnen
identisch — Header plus Anfang der User-Id füllen die 72 Bytes bereits vollständig aus. Folglich
ergaben *alle* Refresh-Tokens eines Nutzers denselben bcrypt-Hash, und der Abgleich schlug bei
jedem alten Token an.

**Behebung:** Ein eigener Port `ITokenHasher` mit einer SHA-256-Implementierung
(`crypto.timingSafeEqual` für den Vergleich). Passwörter bleiben bei bcrypt.

**Was daraus zu lernen ist** — und der Grund, warum das hier steht statt nur im Commit:

1. Ein Hash-Verfahren wird nach dem **Geheimnis** gewählt, nicht aus Gewohnheit. Bcrypts
   Langsamkeit schützt ratbare Geheimnisse; sie ist bei einem 256-Bit-Zufallswert wirkungslos und
   sein Längenlimit dort sogar schädlich.
2. Die Grenze war **bekannt** — sie steht als Kommentar an `PASSWORD_MAX_LENGTH` im selben
   Repository. Sie wurde beim Token trotzdem übersehen. Dokumentiertes Wissen wirkt nur an der
   Stelle, an der jemand es liest.
3. Der Fehler war **stumm**: kein Absturz, keine Warnung, alle Unit-Tests grün. Gefunden wurde er
   erst, als der Ablauf am laufenden System mit echten Tokens durchgespielt wurde. Dafür gibt es
   jetzt einen Regressionstest mit zwei echten Tokens, die sich in den ersten 72 Bytes gleichen.
