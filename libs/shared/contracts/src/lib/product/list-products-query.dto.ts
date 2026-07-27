import { IsIn, IsOptional } from 'class-validator';

/**
 * Filter der oeffentlichen Produktliste (`GET /api/products?showcased=true`).
 *
 * Der Wert bleibt bewusst ein STRING und wird nicht per `@Transform` in ein
 * Boolean gewandelt - Query-Parameter sind nun einmal Strings, und die
 * Umwandlung passiert sichtbar im Controller.
 *
 * Der Grund ist ein handfester: `class-transformer` legt seine Decorator-
 * Metadaten in einer modul-lokalen Variablen ab (`storage.js`:
 * `defaultMetadataStorage = new MetadataStorage()`). Wird das Paket in einem
 * Monorepo zweimal geladen - ueber den Workspace-Symlink, oder weil ein Bundler
 * das `module`-Feld (esm5) nimmt, waehrend NestJS intern die CJS-Variante
 * `require`t -, existieren zwei Storages: `@Transform` registriert im einen,
 * `plainToInstance` liest den anderen. Der Transform greift dann STUMM nicht,
 * und `?showcased=true` scheitert an `@IsBoolean` statt zu funktionieren.
 * `class-validator` hat das Problem nicht, weil es seinen Storage bewusst auf
 * `globalThis` legt.
 *
 * `@IsIn` statt eines freien Strings, damit ein Tippfehler (`?showcased=yes`)
 * ein klares 400 bekommt und nicht still als "nicht gefiltert" durchrutscht.
 */
export class ListProductsQueryDto {
  @IsOptional()
  @IsIn(['true', 'false'])
  showcased?: 'true' | 'false';
}
