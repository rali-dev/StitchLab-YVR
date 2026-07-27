import { Command } from '@nestjs/cqrs';
import type { ProductDto } from '@stitchlab-yvr/shared-contracts';

/**
 * Absicht: "aendere diese Felder an diesem Produkt".
 *
 * `patch` traegt bewusst nur die Felder, die der Aufrufer wirklich mitgeschickt
 * hat - `undefined` heisst "unveraendert lassen", nicht "auf null setzen".
 */
export class UpdateProductCommand extends Command<ProductDto> {
  constructor(
    public readonly id: string,
    public readonly patch: {
      slug?: string;
      name?: string;
      description?: string | null;
      priceCents?: number;
      isShowcased?: boolean;
      isPublished?: boolean;
    },
  ) {
    super();
  }
}
