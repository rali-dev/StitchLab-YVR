import { Query } from '@nestjs/cqrs';
import type { ProductDto } from '@stitchlab-yvr/shared-contracts';

/**
 * Frage: "zeig mir das Produkt zu diesem Slug".
 *
 * Der Slug und nicht die Id, weil die oeffentliche Detailseite unter
 * `/products/<slug>` erreichbar ist - eine sprechende URL ist Teil des
 * Vertrags mit dem Nutzer, die UUID ist es nicht.
 *
 * `onlyPublished` ist wie in `ListProductsQuery` Pflicht: ohne dieses Flag
 * waere ein unveroeffentlichtes Produkt zwar nicht in der Liste, ueber seinen
 * Slug aber trotzdem abrufbar.
 */
export class GetProductBySlugQuery extends Query<ProductDto> {
  constructor(
    public readonly slug: string,
    public readonly onlyPublished: boolean,
  ) {
    super();
  }
}
