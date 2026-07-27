import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  PRODUCT_REPOSITORY,
  type IProductRepository,
} from '@stitchlab-yvr/backend-product-domain';
import type { ProductDto } from '@stitchlab-yvr/shared-contracts';
import { toProductDto } from '../../mappers/product.mapper.js';
import { ListProductsQuery } from './list-products.query.js';

@QueryHandler(ListProductsQuery)
export class ListProductsHandler
  implements IQueryHandler<ListProductsQuery, ProductDto[]>
{
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly products: IProductRepository,
  ) {}

  async execute(query: ListProductsQuery): Promise<ProductDto[]> {
    const products = await this.products.findAll({
      onlyPublished: query.onlyPublished,
      onlyShowcased: query.onlyShowcased,
    });

    return products.map(toProductDto);
  }
}
