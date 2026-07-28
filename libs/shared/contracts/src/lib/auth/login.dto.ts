import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { EMAIL_MAX_LENGTH, PASSWORD_MAX_LENGTH } from './auth.constants.js';

/**
 * Anmeldung.
 *
 * Bewusst OHNE `@MinLength` auf dem Passwort: Beim Login wird nicht geprüft, ob
 * das Passwort heutigen Regeln entspricht, sondern nur, ob es das richtige ist.
 * Würde hier eine Mindestlänge greifen, könnten sich Bestandsnutzer nach einer
 * verschärften Regel nicht mehr anmelden - und die Fehlermeldung würde nebenbei
 * verraten, wie lang das hinterlegte Passwort ist.
 */
export class LoginDto {
  @IsEmail({}, { message: 'email must be a valid email address.' })
  @MaxLength(EMAIL_MAX_LENGTH)
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(PASSWORD_MAX_LENGTH)
  password!: string;
}
