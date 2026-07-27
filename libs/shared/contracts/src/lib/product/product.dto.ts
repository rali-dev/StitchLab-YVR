/**
 * Lese-Vertrag eines Produkts: exakt das, was die API zurueckgibt und das
 * Frontend erwarten darf.
 *
 * Interface statt Klasse, weil hier nichts validiert wird - Responses werden
 * erzeugt, nicht geprueft. Bewusst NICHT die Prisma-Row und nicht die Entity:
 * ein Feld in der Datenbank umzubenennen darf keinen Frontend-Bruch ausloesen.
 *
 * Zeitstempel als ISO-String, weil JSON kein `Date` kennt.
 */
export interface ProductDto {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  priceCents: number;
  isShowcased: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}
