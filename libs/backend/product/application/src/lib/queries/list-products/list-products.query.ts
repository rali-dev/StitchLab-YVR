import { Query } from '@nestjs/cqrs';
import type { ProductDto } from '@stitchlab-yvr/shared-contracts';

/**
 * Frage: "welche Produkte soll ich zeigen?"
 *
 * `onlyPublished` ist Pflicht und hat absichtlich keinen Default: der Aufrufer
 * muss sich entscheiden, ob er den oeffentlichen Katalog oder die
 * Verwaltungssicht meint. Ein stiller Default waere genau die Stelle, an der
 * unveroeffentlichte Produkte irgendwann im Shop auftauchen.
 */
export class ListProductsQuery extends Query<ProductDto[]> {
  constructor(
    public readonly onlyPublished: boolean,
    public readonly onlyShowcased: boolean,
  ) {
    super();
  }
}
