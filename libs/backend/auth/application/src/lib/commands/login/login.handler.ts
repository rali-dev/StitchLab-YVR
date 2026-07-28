import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  Email,
  PASSWORD_HASHER,
  USER_REPOSITORY,
  type IPasswordHasher,
  type IUserRepository,
} from '@stitchlab-yvr/backend-auth-domain';
import { AuthenticationException } from '@stitchlab-yvr/shared-contracts';
import { SessionService } from '../../services/session.service.js';
import { LoginCommand, type LoginResult } from './login.command.js';

/**
 * Ein gültiger bcrypt-Hash eines Wertes, der nie ein Passwort ist.
 *
 * Zweck ist ausschließlich die **Laufzeit**: Existiert die E-Mail nicht, würde
 * der Handler ohne diesen Schritt sofort antworten, während er bei existierender
 * E-Mail ~100 ms für den bcrypt-Vergleich braucht. Dieser Unterschied ist
 * messbar und macht den Login zu einem Werkzeug, mit dem sich gültige Adressen
 * durchprobieren lassen. Der Vergleich gegen diesen Hash gleicht die Zeit an.
 *
 * Der Wert ist kein Geheimnis - er darf öffentlich im Repository stehen.
 */
const TIMING_EQUALIZER_HASH =
  '$2b$12$7pKwLIzNnIOgZbIuPaLN0u.7iVH9IWmI24RxuD5yyAQJoj1xJS/oi';

@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand, LoginResult> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: IPasswordHasher,
    private readonly session: SessionService,
  ) {}

  async execute(command: LoginCommand): Promise<LoginResult> {
    const email = Email.create(command.email).toString();
    const user = await this.users.findByEmail(email);

    if (!user) {
      await this.hasher.compare(command.password, TIMING_EQUALIZER_HASH);
      throw LoginHandler.invalidCredentials();
    }

    if (!(await this.hasher.compare(command.password, user.hashedPassword))) {
      throw LoginHandler.invalidCredentials();
    }

    return this.session.start(user);
  }

  /**
   * IMMER dieselbe Meldung - egal ob die E-Mail unbekannt oder das Passwort
   * falsch war. "email not found" würde den Login in ein Verzeichnis
   * registrierter Adressen verwandeln.
   */
  private static invalidCredentials(): AuthenticationException {
    return new AuthenticationException('invalid email or password.');
  }
}
