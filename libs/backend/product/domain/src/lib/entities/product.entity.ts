import {
  DomainException,
  PRODUCT_DESCRIPTION_MAX_LENGTH,
} from '@stitchlab-yvr/shared-contracts';
import { Money } from '../value-objects/money.value-object.js';
import { ProductName } from '../value-objects/product-name.value-object.js';
import { Slug } from '../value-objects/slug.value-object.js';

/**
 * Flache, primitive Sicht auf ein Produkt - die einzige Form, in der die Entity
 * die Domaene verlaesst (Richtung Datenbank) oder betritt (aus der Datenbank).
 *
 * Damit muss die Infrastruktur weder Value Objects auspacken noch den
 * Konstruktor der Entity kennen, und die Domaene bleibt frei von Prisma-Typen.
 */
export interface ProductSnapshot {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  priceCents: number;
  isShowcased: boolean;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Teil-Aenderung. `description: null` loescht die Beschreibung, `undefined` laesst sie unveraendert. */
export interface ProductUpdate {
  slug?: string;
  name?: string;
  description?: string | null;
  priceCents?: number;
  isShowcased?: boolean;
  isPublished?: boolean;
}

/**
 * Das Produkt - Aggregatwurzel der Product-Domaene.
 *
 * Zwei Eigenschaften machen diese Klasse aus:
 *
 * 1. **Sie kann nicht ungueltig existieren.** Der Konstruktor ist privat; jeder
 *    Weg hinein (`create`, `restore`, `applyUpdate`) laeuft durch dieselben
 *    Pruefungen. Ein `ProductEntity` in der Hand zu haben heisst: die Regeln
 *    gelten.
 * 2. **Sie ist unveraenderlich.** Aenderungen liefern eine NEUE Entity statt das
 *    Objekt zu mutieren. Damit gibt es keinen halb-geaenderten Zwischenzustand,
 *    wenn eine Regel mitten in einem Update zuschlaegt.
 */
export class ProductEntity {
  private constructor(
    public readonly id: string,
    public readonly slug: Slug,
    public readonly name: ProductName,
    public readonly description: string | null,
    public readonly price: Money,
    public readonly isShowcased: boolean,
    public readonly isPublished: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /** Neues Produkt. Erzeugt Identitaet und Zeitstempel selbst. */
  static create(props: {
    slug: string;
    name: string;
    description?: string | null;
    priceCents: number;
    isShowcased?: boolean;
    isPublished?: boolean;
  }): ProductEntity {
    const now = new Date();
    const isShowcased = props.isShowcased ?? false;
    // Neue Produkte sind standardmaessig sichtbar - das Datenmodell setzt
    // denselben Default (`isPublished @default(true)`).
    const isPublished = props.isPublished ?? true;

    ProductEntity.assertShowcaseIsPublished(isShowcased, isPublished);

    return new ProductEntity(
      crypto.randomUUID(),
      Slug.create(props.slug),
      ProductName.create(props.name),
      ProductEntity.normalizeDescription(props.description),
      Money.fromCents(props.priceCents),
      isShowcased,
      isPublished,
      now,
      now,
    );
  }

  /**
   * Rekonstruktion aus der Datenbank. Prueft bewusst dieselben Invarianten wie
   * `create`: liegt in der DB etwas, das die heutigen Regeln verletzt (Altdaten,
   * manueller SQL-Eingriff), soll das laut scheitern statt still weiterzulaufen.
   */
  static restore(snapshot: ProductSnapshot): ProductEntity {
    ProductEntity.assertShowcaseIsPublished(
      snapshot.isShowcased,
      snapshot.isPublished,
    );

    return new ProductEntity(
      snapshot.id,
      Slug.create(snapshot.slug),
      ProductName.create(snapshot.name),
      ProductEntity.normalizeDescription(snapshot.description),
      Money.fromCents(snapshot.priceCents),
      snapshot.isShowcased,
      snapshot.isPublished,
      snapshot.createdAt,
      snapshot.updatedAt,
    );
  }

  /**
   * Wendet eine Teil-Aenderung an und gibt das Ergebnis als neue Entity zurueck.
   * Die Invarianten werden auf dem RESULTAT geprueft, nicht auf dem Patch - nur
   * so faellt auf, wenn erst die Kombination aus altem und neuem Zustand die
   * Regel bricht (z. B. "veroeffentlicht" entfernen, waehrend das Produkt im
   * Schaufenster steht).
   */
  applyUpdate(patch: ProductUpdate): ProductEntity {
    const isShowcased = patch.isShowcased ?? this.isShowcased;
    const isPublished = patch.isPublished ?? this.isPublished;

    ProductEntity.assertShowcaseIsPublished(isShowcased, isPublished);

    return new ProductEntity(
      this.id,
      patch.slug === undefined ? this.slug : Slug.create(patch.slug),
      patch.name === undefined ? this.name : ProductName.create(patch.name),
      patch.description === undefined
        ? this.description
        : ProductEntity.normalizeDescription(patch.description),
      patch.priceCents === undefined
        ? this.price
        : Money.fromCents(patch.priceCents),
      isShowcased,
      isPublished,
      this.createdAt,
      new Date(),
    );
  }

  toSnapshot(): ProductSnapshot {
    return {
      id: this.id,
      slug: this.slug.toString(),
      name: this.name.toString(),
      description: this.description,
      priceCents: this.price.toCents(),
      isShowcased: this.isShowcased,
      isPublished: this.isPublished,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Fachregel: Was im Schaufenster ("Beauties") haengt, muss auch aufrufbar
   * sein. Ein herausgehobenes, aber unveroeffentlichtes Produkt wuerde auf der
   * Startseite erscheinen und beim Klick 404 liefern.
   */
  private static assertShowcaseIsPublished(
    isShowcased: boolean,
    isPublished: boolean,
  ): void {
    if (isShowcased && !isPublished) {
      throw new DomainException(
        'a showcased product must be published as well.',
      );
    }
  }

  /**
   * Leerstring und Whitespace bedeuten fachlich "keine Beschreibung" - sie
   * werden zu `null` vereinheitlicht, damit nicht zwei Werte dasselbe heissen.
   */
  private static normalizeDescription(
    raw: string | null | undefined,
  ): string | null {
    const normalized = raw?.trim() ?? '';

    if (normalized.length === 0) {
      return null;
    }
    if (normalized.length > PRODUCT_DESCRIPTION_MAX_LENGTH) {
      throw new DomainException(
        `description must not exceed ${PRODUCT_DESCRIPTION_MAX_LENGTH} characters.`,
      );
    }

    return normalized;
  }
}
