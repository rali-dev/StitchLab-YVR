import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateProductDto } from './create-product.dto.js';
import { ListProductsQueryDto } from './list-products-query.dto.js';

/**
 * Prueft die aeussere Verteidigungslinie: was die ValidationPipe mit einem
 * eingehenden JSON-Koerper machen wuerde, bevor ein Handler ihn zu sehen
 * bekommt.
 */
const validate = <T extends object>(
  cls: new () => T,
  payload: Record<string, unknown>,
) => validateSync(plainToInstance(cls, payload));

const validPayload = {
  slug: 'embroidered-tote-bag',
  name: 'Embroidered Tote Bag',
  priceCents: 4999,
};

describe('CreateProductDto', () => {
  it('accepts a valid payload', () => {
    expect(validate(CreateProductDto, validPayload)).toHaveLength(0);
  });

  it('accepts a payload without the optional fields', () => {
    expect(validate(CreateProductDto, validPayload)).toHaveLength(0);
  });

  it.each([
    ['missing name', { ...validPayload, name: undefined }],
    ['empty name', { ...validPayload, name: '' }],
    ['uppercase slug', { ...validPayload, slug: 'Tote-Bag' }],
    ['slug with spaces', { ...validPayload, slug: 'tote bag' }],
    ['negative price', { ...validPayload, priceCents: -1 }],
    ['fractional price', { ...validPayload, priceCents: 49.99 }],
    ['price as string', { ...validPayload, priceCents: '4999' }],
    ['non-boolean flag', { ...validPayload, isShowcased: 'yes' }],
  ])('rejects %s', (_case, payload) => {
    expect(validate(CreateProductDto, payload).length).toBeGreaterThan(0);
  });
});

/**
 * Hier stand einmal ein Test, der `@Transform` prueft - er war gruen, waehrend
 * derselbe Aufruf am laufenden Server 400 lieferte. Grund: Jest laedt die
 * Quelldatei direkt (eine Modulinstanz von `class-transformer`), der gebuendelte
 * Server aber zwei. Deshalb verlaesst sich das DTO nicht mehr auf
 * Transform-Metadaten, und dieser Test prueft nur noch, was auch im Bundle gilt.
 */
describe('ListProductsQueryDto', () => {
  it.each(['true', 'false'])('accepts "%s"', (value) => {
    expect(validate(ListProductsQueryDto, { showcased: value })).toHaveLength(0);
  });

  it('accepts an absent filter', () => {
    expect(validate(ListProductsQueryDto, {})).toHaveLength(0);
  });

  // Ein Tippfehler soll ein klares 400 ergeben statt still "nicht gefiltert".
  it.each(['yes', 'TRUE', '1', ''])('rejects "%s"', (value) => {
    expect(
      validate(ListProductsQueryDto, { showcased: value }).length,
    ).toBeGreaterThan(0);
  });
});
