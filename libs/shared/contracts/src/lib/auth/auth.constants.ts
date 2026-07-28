/**
 * Rollen im System. Bewusst ein Objekt statt eines TypeScript-`enum`:
 * `enum` erzeugt Laufzeit-Code, der sich mit `isolatedModules` schlecht
 * verträgt, und die Werte hier müssen exakt den Prisma-Enum-Werten
 * entsprechen - als String-Literale ist das direkt ablesbar.
 */
export const Role = {
  USER: 'USER',
  ADMIN: 'ADMIN',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

/** Längste laut RFC 5321 zulässige E-Mail-Adresse. */
export const EMAIL_MAX_LENGTH = 254;

/**
 * Mindestlänge des Passworts. Länge schlägt Komplexität - eine erzwungene
 * Sonderzeichen-Regel produziert vor allem "Passwort1!" und Zettel am Monitor.
 */
export const PASSWORD_MIN_LENGTH = 10;

/**
 * Obergrenze mit einem sehr konkreten Grund: **bcrypt verarbeitet nur die
 * ersten 72 Bytes** und ignoriert alles danach stillschweigend. Ohne diese
 * Grenze hätten zwei verschiedene lange Passwörter, die in den ersten 72 Bytes
 * übereinstimmen, denselben Hash - der Nutzer glaubt an ein 100-Zeichen-Passwort
 * und hat faktisch ein 72-Zeichen-Passwort. Lieber ehrlich ablehnen.
 */
export const PASSWORD_MAX_LENGTH = 72;

/** Cookie-Namen - Backend setzt sie, das Frontend liest sie nie (httpOnly). */
export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';
