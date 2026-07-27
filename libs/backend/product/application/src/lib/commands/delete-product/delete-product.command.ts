import { Command } from '@nestjs/cqrs';

/** Absicht: "entferne dieses Produkt". Liefert nichts zurueck - es gibt nichts mehr anzuzeigen. */
export class DeleteProductCommand extends Command<void> {
  constructor(public readonly id: string) {
    super();
  }
}
