import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  GetCurrentUserQuery,
  LoginCommand,
  LogoutCommand,
  RefreshSessionCommand,
  RegisterCommand,
  type LoginResult,
} from '@stitchlab-yvr/backend-auth-application';
import {
  LoginDto,
  RegisterDto,
  type UserDto,
} from '@stitchlab-yvr/shared-contracts';
import type { Response } from 'express';
import {
  CurrentRefreshUser,
  CurrentUser,
  type AuthenticatedRefreshUser,
  type AuthenticatedUser,
} from '../decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../guards/jwt-auth.guard.js';
import { JwtRefreshGuard } from '../guards/jwt-refresh.guard.js';
import { AuthCookieService } from '../services/auth-cookie.service.js';

/**
 * Der Anmelde-Zugang (`/api/auth`).
 *
 * Die Besonderheit gegenüber anderen Controllern: Hier werden **Cookies
 * gesetzt**, also braucht er Zugriff auf die Antwort. `@Res({ passthrough:
 * true })` ist dabei entscheidend - ohne `passthrough` übernimmt Express die
 * Kontrolle und NestJS sendet den Rückgabewert der Methode nicht mehr. Der
 * Client bekäme Cookies, aber keinen Antwort-Körper.
 *
 * Die Tokens selbst tauchen in **keiner** Antwort auf; sie verlassen den Server
 * ausschließlich als HttpOnly-Cookies (ADR-0007).
 */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly cookies: AuthCookieService,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDto): Promise<UserDto> {
    return this.commandBus.execute(
      new RegisterCommand(dto.email, dto.password),
    );
  }

  @Post('login')
  // 200 statt des POST-üblichen 201: Es wird keine Ressource angelegt, sondern
  // eine Sitzung begonnen.
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserDto> {
    const result: LoginResult = await this.commandBus.execute(
      new LoginCommand(dto.email, dto.password),
    );

    this.cookies.setAuthCookies(res, result.tokens);

    return result.user;
  }

  /**
   * Tauscht ein gültiges Refresh-Token gegen ein frisches Paar.
   *
   * Geschützt vom `JwtRefreshGuard` - hier zählt der Refresh-Cookie, nicht der
   * Access-Cookie. Genau deshalb funktioniert der Endpunkt auch dann noch, wenn
   * der Access-Token längst abgelaufen ist.
   */
  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  async refresh(
    @CurrentRefreshUser() user: AuthenticatedRefreshUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserDto> {
    const result: LoginResult = await this.commandBus.execute(
      new RefreshSessionCommand(user.sub, user.refreshToken),
    );

    this.cookies.setAuthCookies(res, result.tokens);

    return result.user;
  }

  /**
   * Beendet die Sitzung.
   *
   * Zwei Schritte, und beide sind nötig: Der Command entfernt den
   * Refresh-Token-Hash in der Datenbank (macht ein kopiertes Token wertlos),
   * das Löschen der Cookies räumt den Browser auf. Nur Cookies zu löschen wäre
   * kein Logout, sondern Kosmetik.
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.commandBus.execute(new LogoutCommand(user.sub));

    this.cookies.clearAuthCookies(res);
  }

  /**
   * "Wer bin ich?" - die einzige Möglichkeit für das Frontend, den angemeldeten
   * Nutzer zu erfahren. An das Token kommt es nicht heran (httpOnly).
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getCurrentUser(@CurrentUser() user: AuthenticatedUser): Promise<UserDto> {
    return this.queryBus.execute(new GetCurrentUserQuery(user.sub));
  }
}
