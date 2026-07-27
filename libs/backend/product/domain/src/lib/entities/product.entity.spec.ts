import { DomainException } from '@stitchlab-yvr/shared-contracts';
import { ProductEntity, type ProductSnapshot } from './product.entity.js';

const validProps = {
  slug: 'embroidered-tote-bag',
  name: 'Embroidered Tote Bag',
  description: 'Hand-stitched canvas tote.',
  priceCents: 4999,
};

describe('ProductEntity.create', () => {
  it('builds a product from valid input', () => {
    const product = ProductEntity.create(validProps);

    expect(product.slug.toString()).toBe('embroidered-tote-bag');
    expect(product.name.toString()).toBe('Embroidered Tote Bag');
    expect(product.price.toCents()).toBe(4999);
    expect(product.id).toHaveLength(36);
  });

  it('publishes by default and does not showcase by default', () => {
    const product = ProductEntity.create(validProps);

    expect(product.isPublished).toBe(true);
    expect(product.isShowcased).toBe(false);
  });

  it('normalises a blank description to null', () => {
    const product = ProductEntity.create({ ...validProps, description: '   ' });

    expect(product.description).toBeNull();
  });

  it('rejects a description longer than 2000 characters', () => {
    expect(() =>
      ProductEntity.create({ ...validProps, description: 'x'.repeat(2001) }),
    ).toThrow(DomainException);
  });

  // Die Fachregel: was im Schaufenster haengt, muss auch aufrufbar sein.
  it('rejects a showcased product that is not published', () => {
    expect(() =>
      ProductEntity.create({
        ...validProps,
        isShowcased: true,
        isPublished: false,
      }),
    ).toThrow(DomainException);
  });

  it('allows a showcased product that is published', () => {
    const product = ProductEntity.create({
      ...validProps,
      isShowcased: true,
      isPublished: true,
    });

    expect(product.isShowcased).toBe(true);
  });

  // Die Invarianten der Value Objects gelten auch beim Weg durch die Entity -
  // es gibt keinen Seiteneingang.
  it('propagates value-object rules', () => {
    expect(() => ProductEntity.create({ ...validProps, slug: 'Not A Slug' })).toThrow(
      DomainException,
    );
    expect(() => ProductEntity.create({ ...validProps, name: '' })).toThrow(
      DomainException,
    );
    expect(() => ProductEntity.create({ ...validProps, priceCents: -1 })).toThrow(
      DomainException,
    );
  });
});

describe('ProductEntity.applyUpdate', () => {
  const existing = ProductEntity.create(validProps);

  it('changes only the fields present in the patch', () => {
    const updated = existing.applyUpdate({ priceCents: 5999 });

    expect(updated.price.toCents()).toBe(5999);
    expect(updated.slug.toString()).toBe(existing.slug.toString());
    expect(updated.name.toString()).toBe(existing.name.toString());
    expect(updated.description).toBe(existing.description);
  });

  it('keeps identity and creation time, refreshes the update time', () => {
    const updated = existing.applyUpdate({ name: 'Renamed Tote' });

    expect(updated.id).toBe(existing.id);
    expect(updated.createdAt).toEqual(existing.createdAt);
    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
      existing.updatedAt.getTime(),
    );
  });

  it('leaves the original untouched (the entity is immutable)', () => {
    existing.applyUpdate({ name: 'Renamed Tote' });

    expect(existing.name.toString()).toBe('Embroidered Tote Bag');
  });

  it('treats an explicit null description as "remove it"', () => {
    const updated = existing.applyUpdate({ description: null });

    expect(updated.description).toBeNull();
  });

  // Der Grund, warum die Invariante auf dem RESULTAT geprueft wird: der Patch
  // allein sieht harmlos aus, erst zusammen mit dem alten Zustand bricht er die
  // Regel.
  it('rejects unpublishing a product that is still showcased', () => {
    const showcased = ProductEntity.create({
      ...validProps,
      isShowcased: true,
    });

    expect(() => showcased.applyUpdate({ isPublished: false })).toThrow(
      DomainException,
    );
  });

  it('allows unpublishing and un-showcasing in the same patch', () => {
    const showcased = ProductEntity.create({
      ...validProps,
      isShowcased: true,
    });

    const updated = showcased.applyUpdate({
      isShowcased: false,
      isPublished: false,
    });

    expect(updated.isShowcased).toBe(false);
    expect(updated.isPublished).toBe(false);
  });

  it('rejects an invalid new slug', () => {
    expect(() => existing.applyUpdate({ slug: 'Not A Slug' })).toThrow(
      DomainException,
    );
  });
});

describe('ProductEntity.restore / toSnapshot', () => {
  const snapshot: ProductSnapshot = {
    id: '11111111-1111-4111-8111-111111111111',
    slug: 'linen-scarf',
    name: 'Linen Scarf',
    description: null,
    priceCents: 2500,
    isShowcased: false,
    isPublished: true,
    createdAt: new Date('2026-01-01T10:00:00.000Z'),
    updatedAt: new Date('2026-02-01T10:00:00.000Z'),
  };

  it('round-trips without losing information', () => {
    expect(ProductEntity.restore(snapshot).toSnapshot()).toEqual(snapshot);
  });

  // Altdaten, die die heutigen Regeln verletzen, sollen laut scheitern statt
  // still durch die Anwendung zu laufen.
  it('rejects a stored row that violates a current invariant', () => {
    expect(() =>
      ProductEntity.restore({
        ...snapshot,
        isShowcased: true,
        isPublished: false,
      }),
    ).toThrow(DomainException);
  });
});
