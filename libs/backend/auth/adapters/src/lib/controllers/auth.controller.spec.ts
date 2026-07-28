import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Test } from '@nestjs/testing';
import {
  LoginCommand,
  LogoutCommand,
  RefreshSessionCommand,
  RegisterCommand,
} from '@stitchlab-yvr/backend-auth-application';
import { Role } from '@stitchlab-yvr/shared-contracts';
import type { Response } from 'express';
import { AuthCookieService } from '../services/auth-cookie.service.js';
import { AuthController } from './auth.controller.js';

describe('AuthController', () => {
  let controller: AuthController;
  let commandBus: { execute: jest.Mock };
  let queryBus: { execute: jest.Mock };
  let cookies: { setAuthCookies: jest.Mock; clearAuthCookies: jest.Mock };
  let res: Response;

  const userDto = {
    id: 'user-id',
    email: 'anna@example.com',
    role: Role.USER,
    createdAt: '2026-07-28T10:00:00.000Z',
  };
  const tokens = { accessToken: 'access.jwt', refreshToken: 'refresh.jwt' };

  beforeEach(async () => {
    commandBus = { execute: jest.fn() };
    queryBus = { execute: jest.fn() };
    cookies = { setAuthCookies: jest.fn(), clearAuthCookies: jest.fn() };
    res = {} as Response;

    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: CommandBus, useValue: commandBus },
        { provide: QueryBus, useValue: queryBus },
        { provide: AuthCookieService, useValue: cookies },
      ],
    }).compile();

    controller = moduleRef.get(AuthController);
  });

  describe('register', () => {
    it('dispatches a register command', async () => {
      commandBus.execute.mockResolvedValue(userDto);

      await controller.register({
        email: 'anna@example.com',
        password: 'correct-horse-battery',
      });

      expect(commandBus.execute.mock.calls[0][0]).toBeInstanceOf(
        RegisterCommand,
      );
    });

    // Registrieren beginnt keine Sitzung - es setzt deshalb auch keine Cookies.
    it('does not set any cookies', async () => {
      commandBus.execute.mockResolvedValue(userDto);

      await controller.register({
        email: 'anna@example.com',
        password: 'correct-horse-battery',
      });

      expect(cookies.setAuthCookies).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    beforeEach(() => {
      commandBus.execute.mockResolvedValue({ user: userDto, tokens });
    });

    it('dispatches a login command and sets the cookies', async () => {
      await controller.login(
        { email: 'anna@example.com', password: 'pw' },
        res,
      );

      expect(commandBus.execute.mock.calls[0][0]).toBeInstanceOf(LoginCommand);
      expect(cookies.setAuthCookies).toHaveBeenCalledWith(res, tokens);
    });

    // Der Kern von ADR-0007: Die Tokens gehen ausschließlich als Cookies raus.
    // Stünden sie im Antwort-Körper, könnte JavaScript sie lesen - und der
    // ganze httpOnly-Aufwand wäre umsonst.
    it('never returns the tokens in the response body', async () => {
      const body = await controller.login(
        { email: 'anna@example.com', password: 'pw' },
        res,
      );

      expect(body).toEqual(userDto);
      expect(JSON.stringify(body)).not.toContain('access.jwt');
      expect(JSON.stringify(body)).not.toContain('refresh.jwt');
    });
  });

  describe('refresh', () => {
    it('passes the raw refresh token to the command', async () => {
      commandBus.execute.mockResolvedValue({ user: userDto, tokens });

      await controller.refresh(
        {
          sub: 'user-id',
          email: 'anna@example.com',
          role: Role.USER,
          refreshToken: 'raw.refresh.token',
        },
        res,
      );

      const command = commandBus.execute.mock
        .calls[0][0] as RefreshSessionCommand;
      expect(command).toBeInstanceOf(RefreshSessionCommand);
      expect(command.userId).toBe('user-id');
      expect(command.refreshToken).toBe('raw.refresh.token');
    });

    it('replaces the cookies with the fresh pair', async () => {
      commandBus.execute.mockResolvedValue({ user: userDto, tokens });

      await controller.refresh(
        {
          sub: 'user-id',
          email: 'anna@example.com',
          role: Role.USER,
          refreshToken: 'raw',
        },
        res,
      );

      expect(cookies.setAuthCookies).toHaveBeenCalledWith(res, tokens);
    });
  });

  describe('logout', () => {
    // Beides ist nötig: Der Command entwertet das Token serverseitig, das
    // Löschen räumt den Browser auf. Nur eines von beidem wäre ein halber Logout.
    it('ends the session server-side AND clears the cookies', async () => {
      commandBus.execute.mockResolvedValue(undefined);

      await controller.logout(
        { sub: 'user-id', email: 'anna@example.com', role: Role.USER },
        res,
      );

      expect(commandBus.execute.mock.calls[0][0]).toBeInstanceOf(LogoutCommand);
      expect(cookies.clearAuthCookies).toHaveBeenCalledWith(res);
    });
  });

  describe('me', () => {
    it('asks for the user behind the token', async () => {
      queryBus.execute.mockResolvedValue(userDto);

      await controller.getCurrentUser({
        sub: 'user-id',
        email: 'anna@example.com',
        role: Role.USER,
      });

      expect(queryBus.execute.mock.calls[0][0]).toMatchObject({
        userId: 'user-id',
      });
    });
  });
});
