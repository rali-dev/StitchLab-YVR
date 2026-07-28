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
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  JwtAuthGuard,
  Roles,
  RolesGuard,
} from '@stitchlab-yvr/backend-auth-adapters';
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
  Role,
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
   * Oeffentlicher Katalog - ohne Guard, jeder darf ihn sehen.
   *
   * `onlyPublished` ist fest `true` und bewusst KEIN Query-Parameter: Sonst
   * koennte jeder Besucher mit `?includeUnpublished=true` die Entwuerfe lesen.
   * Die Verwaltungssicht bekommt spaeter eine eigene, geschuetzte Route.
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

  /**
   * Ab hier: nur Verwaltung.
   *
   * Die Reihenfolge der Guards ist bedeutsam - der `JwtAuthGuard` muss zuerst
   * laufen, denn er stellt `request.user` bereit, das der `RolesGuard` auswertet.
   * Wer nicht angemeldet ist, bekommt 401; wer angemeldet, aber kein Admin ist,
   * bekommt 403.
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
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

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updateProduct(
    // `ParseUUIDPipe` faengt Unsinn ab, bevor die Datenbank ihn sieht: ohne ihn
    // wuerde Postgres bei einer kaputten UUID einen 500er werfen statt eines 400.
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductDto> {
    return this.commandBus.execute(new UpdateProductCommand(id, dto));
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  // 204: erfolgreich, aber es gibt nichts mehr zurueckzugeben.
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteProduct(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.commandBus.execute(new DeleteProductCommand(id));
  }
}
