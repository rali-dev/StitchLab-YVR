import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  PRODUCT_REPOSITORY,
  type IProductRepository,
} from '@stitchlab-yvr/backend-product-domain';
import {
  ResourceNotFoundException,
  type ProductDto,
} from '@stitchlab-yvr/shared-contracts';
import { toProductDto } from '../../mappers/product.mapper.js';
import { GetProductBySlugQuery } from './get-product-by-slug.query.js';

@QueryHandler(GetProductBySlugQuery)
export class GetProductBySlugHandler
  implements IQueryHandler<GetProductBySlugQuery, ProductDto>
{
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly products: IProductRepository,
  ) {}

  async execute(query: GetProductBySlugQuery): Promise<ProductDto> {
    const product = await this.products.findBySlug(query.slug);

    // Ein unveroeffentlichtes Produkt wird fuer die oeffentliche Sicht wie
    // "nicht vorhanden" behandelt - bewusst 404 und nicht 403: eine
    // Verbotsmeldung wuerde bestaetigen, dass es den Slug gibt, und damit
    // unveroeffentlichte Namen erratbar machen.
    if (!product || (query.onlyPublished && !product.isPublished)) {
      throw new ResourceNotFoundException(
        `product "${query.slug}" does not exist.`,
      );
    }

    return toProductDto(product);
  }
}
