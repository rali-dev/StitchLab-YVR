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
 * Teil-Aenderung eines Produkts (PATCH): jedes Feld ist optional, weggelassene
 * Felder bleiben unveraendert.
 *
 * Bewusst ausgeschrieben statt `PartialType(CreateProductDto)` - `PartialType`
 * kommt aus `@nestjs/mapped-types`, und `shared-contracts` ist
 * `platform:universal`: die Datei wird auch vom Angular-Frontend importiert und
 * darf deshalb keine NestJS-Abhaengigkeit hereinziehen.
 *
 * `description: null` ist erlaubt und bedeutet "Beschreibung entfernen" -
 * unterscheidbar von "Feld nicht mitgeschickt".
 */
export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(PRODUCT_NAME_MAX_LENGTH)
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(PRODUCT_SLUG_MAX_LENGTH)
  @Matches(PRODUCT_SLUG_PATTERN, {
    message:
      'slug must contain only lowercase letters, digits and single hyphens.',
  })
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(PRODUCT_DESCRIPTION_MAX_LENGTH)
  description?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(PRODUCT_PRICE_MAX_CENTS)
  priceCents?: number;

  @IsOptional()
  @IsBoolean()
  isShowcased?: boolean;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
