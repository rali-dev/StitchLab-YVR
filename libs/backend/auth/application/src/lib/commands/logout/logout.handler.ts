import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '@stitchlab-yvr/backend-auth-domain';
import { LogoutCommand } from './logout.command.js';

@CommandHandler(LogoutCommand)
export class LogoutHandler implements ICommandHandler<LogoutCommand, void> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
  ) {}

  async execute(command: LogoutCommand): Promise<void> {
    const user = await this.users.findById(command.userId);

    // Bewusst idempotent: Ist der Nutzer nicht (mehr) da oder war die Sitzung
    // schon beendet, ist das gewünschte Ergebnis bereits erreicht. Ein Fehler
    // wäre hier nur lästig - der Aufrufer wollte abgemeldet sein, und das ist er.
    if (!user || !user.hasActiveSession()) {
      return;
    }

    await this.users.save(user.withoutRefreshToken());
  }
}
