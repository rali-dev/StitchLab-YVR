/**
 * Fachliche Tatsache: ein Produkt wurde angelegt. Vergangenheitsform, weil das
 * Ereignis bereits passiert ist - es ist keine Aufforderung (das waere ein
 * Command), sondern eine Mitteilung, auf die beliebig viele Interessenten
 * reagieren duerfen (spaeter etwa: Suchindex, Cache-Invalidierung).
 *
 * Traegt nur Identifikatoren, keine Entity: Empfaenger, die Details brauchen,
 * laden sie selbst - so bleibt das Ereignis auch dann korrekt, wenn es
 * verzoegert verarbeitet wird.
 */
export class ProductCreatedEvent {
  constructor(
    public readonly productId: string,
    public readonly slug: string,
  ) {}
}
