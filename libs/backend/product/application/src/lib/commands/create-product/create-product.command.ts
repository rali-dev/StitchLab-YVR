import { Command } from '@nestjs/cqrs';
import type { ProductDto } from '@stitchlab-yvr/shared-contracts';

/**
 * Absicht: "lege dieses Produkt an".
 *
 * Eigener Typ statt des DTOs, obwohl die Felder sich gleichen: das DTO ist der
 * HTTP-Vertrag und darf sich mit der API aendern, der Command ist der interne
 * Auftrag. Ein zweiter Ausloeser (CLI-Seed, Import-Job) erzeugt denselben
 * Command, ohne jemals ein HTTP-DTO zu bauen.
 *
 * `extends Command<ProductDto>` macht den Rueckgabetyp am Bus typsicher:
 * `commandBus.execute(new CreateProductCommand(...))` ist ohne Zutun ein
 * `Promise<ProductDto>`.
 */
export class CreateProductCommand extends Command<ProductDto> {
  constructor(
    public readonly slug: string,
    public readonly name: string,
    public readonly priceCents: number,
    public readonly description?: string | null,
    public readonly isShowcased?: boolean,
    public readonly isPublished?: boolean,
  ) {
    super();
  }
}
