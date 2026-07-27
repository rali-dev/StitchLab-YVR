import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  PRODUCT_DESCRIPTION_MAX_LENGTH,
  PRODUCT_NAME_MAX_LENGTH,
  PRODUCT_PRICE_MAX_CENTS,
  PRODUCT_SLUG_MAX_LENGTH,
  PRODUCT_SLUG_PATTERN,
} from './product.constants.js';

/**
 * Schreib-Vertrag: was der Client beim Anlegen eines Produkts schicken darf.
 *
 * Die Decoratoren sind die *aeussere* Verteidigungslinie (globale
 * ValidationPipe, HTTP 400 bevor irgendein Handler laeuft). Die *eigentliche*
 * Regel lebt trotzdem in der Entity - ein Produkt kann auch ohne HTTP entstehen
 * (Seed, Import, Test), und dann darf keine Invariante uebersprungen werden.
 */
export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(PRODUCT_NAME_MAX_LENGTH)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(PRODUCT_SLUG_MAX_LENGTH)
  @Matches(PRODUCT_SLUG_PATTERN, {
    message:
      'slug must contain only lowercase letters, digits and single hyphens.',
  })
  slug!: string;

  @IsOptional()
  @IsString()
  @MaxLength(PRODUCT_DESCRIPTION_MAX_LENGTH)
  description?: string;

  // Geld als Integer-Cent: Fliesskomma-Rundungsfehler haben in Preisen nichts
  // zu suchen (0.1 + 0.2 !== 0.3).
  @IsInt()
  @Min(0)
  @Max(PRODUCT_PRICE_MAX_CENTS)
  priceCents!: number;

  @IsOptional()
  @IsBoolean()
  isShowcased?: boolean;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
