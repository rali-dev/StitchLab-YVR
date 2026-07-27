import { ProductEntity } from '../entities/product.entity.js';

/**
 * DI-Token fuer das Repository.
 *
 * Ein `Symbol` und kein String: Symbole sind garantiert eindeutig, es kann also
 * keine zweite Bibliothek versehentlich denselben Token belegen. NestJS braucht
 * einen Laufzeitwert zum Aufloesen - ein Interface allein verschwindet beim
 * Kompilieren und taugt deshalb nicht als Token.
 *
 * Warum das Token hier in `domain` wohnt: die Anwendungsschicht bestellt damit
 * "irgendeine Produkt-Persistenz", ohne Prisma zu kennen. Wer liefert, entscheidet
 * das Infrastructure-Modul - das ist die Dependency Inversion in einer Zeile.
 */
export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');

/** Filter der Produktliste. Bewusst explizit statt optionaler Felder: der Aufrufer soll sich entscheiden. */
export interface ProductListFilter {
  /** `true` = nur veroeffentlichte Produkte (oeffentlicher Katalog). */
  onlyPublished: boolean;
  /** `true` = nur Schaufenster-Produkte ("Beauties"). */
  onlyShowcased: boolean;
}

/**
 * Der Port zur Persistenz - formuliert in Begriffen der Domaene, nicht der
 * Datenbank. Kein `findMany`, kein `where`, keine Prisma-Typen: was hier steht,
 * muss auch mit einer anderen Speicherung erfuellbar sein.
 */
export interface IProductRepository {
  findById(id: string): Promise<ProductEntity | null>;

  findBySlug(slug: string): Promise<ProductEntity | null>;

  findAll(filter: ProductListFilter): Promise<ProductEntity[]>;

  /**
   * Legt an oder aktualisiert und gibt den TATSAECHLICH gespeicherten Zustand
   * zurueck. Der Rueckgabewert ist Absicht: die Datenbank setzt Felder selbst
   * (`updatedAt`), und der Aufrufer soll den echten Stand ausliefern statt einer
   * Vermutung darueber.
   */
  save(product: ProductEntity): Promise<ProductEntity>;

  delete(id: string): Promise<void>;

  /** Guenstige Vorabpruefung fuer die Slug-Eindeutigkeit (siehe CreateProductHandler). */
  existsBySlug(slug: string, excludeId?: string): Promise<boolean>;
}
