/**
 * Gemeinsame Grenzwerte fuer Produkte. Bewusst hier und nicht doppelt in DTO
 * und Entity: die DTO-Validierung (schnelles Nein an der HTTP-Grenze) und die
 * Domaenen-Invariante (die eigentliche Wahrheit) muessen dieselbe Zahl meinen -
 * sonst akzeptiert die eine Schicht, was die andere ablehnt.
 */
export const PRODUCT_NAME_MAX_LENGTH = 120;
export const PRODUCT_SLUG_MAX_LENGTH = 80;
export const PRODUCT_DESCRIPTION_MAX_LENGTH = 2000;

/** Obergrenze fuer Preise in Cent (= 1.000.000,00) - faengt Tippfehler ab. */
export const PRODUCT_PRICE_MAX_CENTS = 100_000_000;

/**
 * Kleinbuchstaben, Ziffern und einzelne Bindestriche als Trenner - kein
 * fuehrender/abschliessender und kein doppelter Bindestrich. Der Slug landet in
 * der URL, deshalb keine Umlaute, Leerzeichen oder Grossbuchstaben.
 */
export const PRODUCT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
