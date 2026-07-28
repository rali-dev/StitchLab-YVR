import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import {
  EMAIL_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from './auth.constants.js';

/** Registrierung eines neuen Kontos. */
export class RegisterDto {
  @IsEmail({}, { message: 'email must be a valid email address.' })
  @MaxLength(EMAIL_MAX_LENGTH)
  email!: string;

  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH, {
    message: `password must be at least ${PASSWORD_MIN_LENGTH} characters long.`,
  })
  // Siehe `PASSWORD_MAX_LENGTH`: bcrypt schneidet nach 72 Bytes stillschweigend
  // ab - ein zu langes Passwort wird deshalb abgelehnt statt gekürzt.
  @MaxLength(PASSWORD_MAX_LENGTH, {
    message: `password must not exceed ${PASSWORD_MAX_LENGTH} characters.`,
  })
  password!: string;
}
