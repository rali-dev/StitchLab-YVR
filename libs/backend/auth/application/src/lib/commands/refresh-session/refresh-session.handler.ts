import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  TOKEN_HASHER,
  USER_REPOSITORY,
  type ITokenHasher,
  type IUserRepository,
} from '@stitchlab-yvr/backend-auth-domain';
import { AuthenticationException } from '@stitchlab-yvr/shared-contracts';
import { SessionService } from '../../services/session.service.js';
import type { LoginResult } from '../login/login.command.js';
import { RefreshSessionCommand } from './refresh-session.command.js';

@CommandHandler(RefreshSessionCommand)
export class RefreshSessionHandler
  implements ICommandHandler<RefreshSessionCommand, LoginResult>
{
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(TOKEN_HASHER) private readonly tokenHasher: ITokenHasher,
    private readonly session: SessionService,
  ) {}

  async execute(command: RefreshSessionCommand): Promise<LoginResult> {
    const user = await this.users.findById(command.userId);

    // Der zweite Teil ist der Logout-Fall: Das Token mag noch gültig signiert
    // sein, aber serverseitig wurde die Sitzung beendet (`hashedRefreshToken`
    // ist null). Ohne diese Prüfung wäre ein Logout wirkungslos, bis das Token
    // von selbst abläuft. Bewusst auf das Feld statt auf `hasActiveSession()`
    // geprüft - so weiß der Compiler danach, dass der Hash vorhanden ist, und
    // es braucht keinen Cast.
    if (!user || user.hashedRefreshToken === null) {
      throw RefreshSessionHandler.invalidSession();
    }

    // Der eigentliche Rotations-Check: Nur das ZULETZT ausgegebene Token passt
    // zum hinterlegten Hash. Ein zuvor benutztes (oder abgefangenes) Token
    // scheitert hier.
    const matches = this.tokenHasher.compare(
      command.refreshToken,
      user.hashedRefreshToken,
    );

    if (!matches) {
      throw RefreshSessionHandler.invalidSession();
    }

    return this.session.start(user);
  }

  private static invalidSession(): AuthenticationException {
    return new AuthenticationException('session is no longer valid.');
  }
}
