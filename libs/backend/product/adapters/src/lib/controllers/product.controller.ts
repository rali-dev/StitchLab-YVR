import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  CreateProductCommand,
  DeleteProductCommand,
  GetProductBySlugQuery,
  ListProductsQuery,
  UpdateProductCommand,
} from '@stitchlab-yvr/backend-product-application';
import {
  CreateProductDto,
  ListProductsQueryDto,
  UpdateProductDto,
  type ProductDto,
} from '@stitchlab-yvr/shared-contracts';

/**
 * HTTP-Zugang zur Produkt-Domaene (`/api/products`).
 *
 * Der Controller enthaelt bewusst KEINE Fachlogik. Seine ganze Aufgabe ist
 * uebersetzen: HTTP-Anfrage -> Command/Query, Ergebnis -> HTTP-Antwort. Die
 * Entscheidung, ob etwas erlaubt ist, faellt in der Entity; wer sie ausfuehrt,
 * bestimmt der Bus. Deshalb steht hier kein injizierter Service.
 *
 * Fehler werden nicht abgefangen: `DomainException` und ihre Unterklassen
 * uebersetzt der globale `DomainExceptionFilter` (apps/backend) in 400/404/409.
 */
@Controller('products')
export class ProductController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * Oeffentlicher Katalog. `onlyPublished` ist hier fest `true`: solange es
   * keine Authentifizierung gibt, darf diese Route keine unveroeffentlichten
   * Produkte zeigen. Die Verwaltungssicht bekommt spaeter eine eigene,
   * geschuetzte Route - nicht einen Query-Parameter, den jeder setzen kann.
   */
  @Get()
  listProducts(@Query() query: ListProductsQueryDto): Promise<ProductDto[]> {
    // Der Query-Parameter kommt als String an und wird hier sichtbar in ein
    // Boolean uebersetzt - siehe die Begruendung in `ListProductsQueryDto`,
    // warum das NICHT per `@Transform` im DTO passiert.
    return this.queryBus.execute(
      new ListProductsQuery(true, query.showcased === 'true'),
    );
  }

  @Get(':slug')
  getProduct(@Param('slug') slug: string): Promise<ProductDto> {
    return this.queryBus.execute(new GetProductBySlugQuery(slug, true));
  }

  // TODO(auth): Schreibzugriffe mit `@UseGuards(JwtAuthGuard, RolesGuard)` und
  // `@Roles('ADMIN')` absichern, sobald die Auth-Domaene steht. Bis dahin kann
  // JEDER Produkte anlegen, aendern und loeschen - dieser Stand gehoert nicht
  // oeffentlich deployt.
  @Post()
  createProduct(@Body() dto: CreateProductDto): Promise<ProductDto> {
    return this.commandBus.execute(
      new CreateProductCommand(
        dto.slug,
        dto.name,
        dto.priceCents,
        dto.description,
        dto.isShowcased,
        dto.isPublished,
      ),
    );
  }

  // TODO(auth): siehe createProduct.
  @Patch(':id')
  updateProduct(
    // `ParseUUIDPipe` faengt Unsinn ab, bevor die Datenbank ihn sieht: ohne ihn
    // wuerde Postgres bei einer kaputten UUID einen 500er werfen statt eines 400.
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductDto> {
    return this.commandBus.execute(new UpdateProductCommand(id, dto));
  }

  // TODO(auth): siehe createProduct.
  @Delete(':id')
  // 204: erfolgreich, aber es gibt nichts mehr zurueckzugeben.
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteProduct(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.commandBus.execute(new DeleteProductCommand(id));
  }
}
