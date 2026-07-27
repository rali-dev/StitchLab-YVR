import { Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { ProductCreatedEvent } from '@stitchlab-yvr/backend-product-domain';

/**
 * Erster Empfaenger von `ProductCreatedEvent`.
 *
 * Er protokolliert nur - und genau darin liegt sein Zweck: er zeigt, dass das
 * Anlegen eines Produkts und die Reaktionen darauf entkoppelt sind. Kommt
 * spaeter ein Suchindex, eine Cache-Invalidierung oder eine
 * Benachrichtigung dazu, entsteht daneben ein weiterer Listener - der
 * `CreateProductHandler` bleibt unveraendert.
 *
 * Wichtig: Fehler hier duerfen das Anlegen nicht rueckgaengig machen. Der
 * EventBus arbeitet nach dem Commit, das Produkt existiert bereits.
 */
@EventsHandler(ProductCreatedEvent)
export class ProductCreatedListener implements IEventHandler<ProductCreatedEvent> {
  private readonly logger = new Logger(ProductCreatedListener.name);

  handle(event: ProductCreatedEvent): void {
    this.logger.log(
      `Product created: ${event.slug} (${event.productId})`,
    );
  }
}
