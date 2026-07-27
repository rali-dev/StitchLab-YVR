import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  PRODUCT_REPOSITORY,
  type IProductRepository,
} from '@stitchlab-yvr/backend-product-domain';
import {
  ResourceConflictException,
  ResourceNotFoundException,
  type ProductDto,
} from '@stitchlab-yvr/shared-contracts';
import { toProductDto } from '../../mappers/product.mapper.js';
import { UpdateProductCommand } from './update-product.command.js';

@CommandHandler(UpdateProductCommand)
export class UpdateProductHandler
  implements ICommandHandler<UpdateProductCommand, ProductDto>
{
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly products: IProductRepository,
  ) {}

  async execute(command: UpdateProductCommand): Promise<ProductDto> {
    const existing = await this.products.findById(command.id);

    if (!existing) {
      throw new ResourceNotFoundException(
        `product "${command.id}" does not exist.`,
      );
    }

    // Nur pruefen, wenn sich der Slug tatsaechlich aendert - sonst wuerde ein
    // Produkt mit seinem eigenen Slug kollidieren. `excludeId` deckt zusaetzlich
    // den Fall ab, dass derselbe Wert erneut geschickt wird.
    const nextSlug = command.patch.slug;
    if (
      nextSlug !== undefined &&
      nextSlug !== existing.slug.toString() &&
      (await this.products.existsBySlug(nextSlug, existing.id))
    ) {
      throw new ResourceConflictException(
        `a product with slug "${nextSlug}" already exists.`,
      );
    }

    // Die Entity entscheidet, ob der Zielzustand erlaubt ist - der Handler
    // orchestriert nur.
    const updated = existing.applyUpdate(command.patch);
    const saved = await this.products.save(updated);

    return toProductDto(saved);
  }
}
