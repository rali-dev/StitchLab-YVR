import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import {
  PRODUCT_REPOSITORY,
  ProductCreatedEvent,
  ProductEntity,
  // `import type` ist hier Pflicht, nicht Stilfrage: mit `emitDecoratorMetadata`
  // schreibt TypeScript die Konstruktor-Typen als Laufzeit-Metadaten heraus. Ein
  // Interface existiert zur Laufzeit aber nicht - ohne das `type` wuerde
  // versucht, es zu importieren (TS1272 unter `isolatedModules`).
  type IProductRepository,
} from '@stitchlab-yvr/backend-product-domain';
import {
  ResourceConflictException,
  type ProductDto,
} from '@stitchlab-yvr/shared-contracts';
import { toProductDto } from '../../mappers/product.mapper.js';
import { CreateProductCommand } from './create-product.command.js';

@CommandHandler(CreateProductCommand)
export class CreateProductHandler
  implements ICommandHandler<CreateProductCommand, ProductDto>
{
  constructor(
    // Injiziert wird das Symbol-Token, nicht die Prisma-Klasse: dieser Handler
    // laesst sich deshalb ohne Datenbank testen und weiss nicht, wo Produkte
    // liegen.
    @Inject(PRODUCT_REPOSITORY)
    private readonly products: IProductRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateProductCommand): Promise<ProductDto> {
    // Vorabpruefung fuer eine verstaendliche Fehlermeldung. Sie ersetzt NICHT
    // den Unique-Index: zwischen Pruefung und Insert kann ein zweiter Request
    // denselben Slug belegen. Diesen Wettlauf faengt das Repository ueber den
    // Datenbankfehler ab - hier geht es nur um die bessere Diagnose im
    // Normalfall.
    if (await this.products.existsBySlug(command.slug)) {
      throw new ResourceConflictException(
        `a product with slug "${command.slug}" already exists.`,
      );
    }

    // Die Entity prueft die Fachregeln - erst danach existiert das Produkt.
    const product = ProductEntity.create({
      slug: command.slug,
      name: command.name,
      description: command.description,
      priceCents: command.priceCents,
      isShowcased: command.isShowcased,
      isPublished: command.isPublished,
    });

    const saved = await this.products.save(product);

    // Erst nach dem erfolgreichen Speichern melden: ein Ereignis beschreibt,
    // was passiert IST. Waere es vorher publiziert, koennten Empfaenger auf ein
    // Produkt reagieren, das nie gespeichert wurde.
    this.eventBus.publish(
      new ProductCreatedEvent(saved.id, saved.slug.toString()),
    );

    return toProductDto(saved);
  }
}
