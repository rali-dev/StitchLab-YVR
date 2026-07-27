import { ProductEntity } from '@stitchlab-yvr/backend-product-domain';
import type { ProductDto } from '@stitchlab-yvr/shared-contracts';

/**
 * Uebersetzt die Entity in den Lese-Vertrag der API.
 *
 * Diese Uebersetzung ist Absicht und kein Boilerplate: die Entity darf sich
 * frei weiterentwickeln (neue Value Objects, interne Felder), ohne dass sich
 * die Antwort an das Frontend aendert. Wuerde der Controller die Entity direkt
 * zurueckgeben, waere jede Umbenennung im Kern ein Breaking Change fuer den
 * Client - und private Felder landeten ungewollt im JSON.
 */
export function toProductDto(product: ProductEntity): ProductDto {
  return {
    id: product.id,
    slug: product.slug.toString(),
    name: product.name.toString(),
    description: product.description,
    priceCents: product.price.toCents(),
    isShowcased: product.isShowcased,
    isPublished: product.isPublished,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}
