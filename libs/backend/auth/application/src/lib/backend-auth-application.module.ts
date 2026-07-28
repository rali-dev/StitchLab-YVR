import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { LoginHandler } from './commands/login/login.handler.js';
import { LogoutHandler } from './commands/logout/logout.handler.js';
import { RefreshSessionHandler } from './commands/refresh-session/refresh-session.handler.js';
import { RegisterHandler } from './commands/register/register.handler.js';
import { GetCurrentUserHandler } from './queries/get-current-user/get-current-user.handler.js';
import { SessionService } from './services/session.service.js';

const COMMAND_HANDLERS = [
  RegisterHandler,
  LoginHandler,
  RefreshSessionHandler,
  LogoutHandler,
];

const QUERY_HANDLERS = [GetCurrentUserHandler];

/**
 * Die Anwendungsfaelle der Auth-Domaene.
 *
 * Wie beim Product-Modul: kein Import der Infrastruktur. Die Handler bestellen
 * ueber `USER_REPOSITORY`, `PASSWORD_HASHER` und `TOKEN_ISSUER` - dass dahinter
 * Prisma, bcrypt und JWT stecken, entscheidet allein das AppModule.
 */
@Module({
  imports: [CqrsModule],
  providers: [...COMMAND_HANDLERS, ...QUERY_HANDLERS, SessionService],
  exports: [CqrsModule],
})
export class BackendAuthApplicationModule {}
