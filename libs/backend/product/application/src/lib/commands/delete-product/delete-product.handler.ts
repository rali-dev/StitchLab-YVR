import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  PRODUCT_REPOSITORY,
  type IProductRepository,
} from '@stitchlab-yvr/backend-product-domain';
import { ResourceNotFoundException } from '@stitchlab-yvr/shared-contracts';
import { DeleteProductCommand } from './delete-product.command.js';

@CommandHandler(DeleteProductCommand)
export class DeleteProductHandler
  implements ICommandHandler<DeleteProductCommand, void>
{
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly products: IProductRepository,
  ) {}

  async execute(command: DeleteProductCommand): Promise<void> {
    // Bewusst erst pruefen: ein DELETE auf eine unbekannte Id soll 404 melden
    // statt so zu tun, als haette es etwas geloescht. Das deckt den haeufigsten
    // Fall (Tippfehler in der Id) auf, statt ihn zu verschlucken.
    const existing = await this.products.findById(command.id);

    if (!existing) {
      throw new ResourceNotFoundException(
        `product "${command.id}" does not exist.`,
      );
    }

    await this.products.delete(command.id);
  }
}
