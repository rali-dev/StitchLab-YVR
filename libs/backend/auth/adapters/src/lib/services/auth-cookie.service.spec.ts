import { ConfigService } from '@nestjs/config';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from '@stitchlab-yvr/shared-contracts';
import type { Response } from 'express';
import { AuthCookieService } from './auth-cookie.service.js';

describe('AuthCookieService', () => {
  let res: { cookie: jest.Mock; clearCookie: jest.Mock };

  const serviceFor = (nodeEnv: string) =>
    new AuthCookieService({
      get: () => nodeEnv,
    } as unknown as ConfigService);

  const tokens = { accessToken: 'access.jwt', refreshToken: 'refresh.jwt' };

  beforeEach(() => {
    res = { cookie: jest.fn(), clearCookie: jest.fn() };
  });

  const optionsFor = (name: string) =>
    res.cookie.mock.calls.find((call) => call[0] === name)?.[2];

  it('sets both cookies', () => {
    serviceFor('production').setAuthCookies(res as unknown as Response, tokens);

    expect(res.cookie).toHaveBeenCalledWith(
      ACCESS_TOKEN_COOKIE,
      'access.jwt',
      expect.any(Object),
    );
    expect(res.cookie).toHaveBeenCalledWith(
      REFRESH_TOKEN_COOKIE,
      'refresh.jwt',
      expect.any(Object),
    );
  });

  // Die drei Attribute, an denen der ganze Ansatz hängt (ADR-0007).
  it.each([ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE])(
    '%s is httpOnly, SameSite=Strict and host-only',
    (cookieName) => {
      serviceFor('production').setAuthCookies(
        res as unknown as Response,
        tokens,
      );

      const options = optionsFor(cookieName);
      expect(options.httpOnly).toBe(true);
      expect(options.sameSite).toBe('strict');
      // Kein `domain` - sonst ginge das Cookie an jede Subdomain.
      expect(options.domain).toBeUndefined();
    },
  );

  it('marks cookies Secure in production', () => {
    serviceFor('production').setAuthCookies(res as unknown as Response, tokens);

    expect(optionsFor(ACCESS_TOKEN_COOKIE).secure).toBe(true);
  });

  // Lokal läuft der Server auf http://localhost - mit `Secure` würde der Browser
  // das Cookie verwerfen und der Login schlüge unerklärlich fehl.
  it('drops Secure outside production so local development works', () => {
    serviceFor('development').setAuthCookies(res as unknown as Response, tokens);

    expect(optionsFor(ACCESS_TOKEN_COOKIE).secure).toBe(false);
  });

  // Der Refresh-Cookie soll bei normalen API-Aufrufen gar nicht mitgeschickt
  // werden - das begrenzt seine Angriffsfläche.
  it('limits the refresh cookie to /api/auth', () => {
    serviceFor('production').setAuthCookies(res as unknown as Response, tokens);

    expect(optionsFor(ACCESS_TOKEN_COOKIE).path).toBe('/');
    expect(optionsFor(REFRESH_TOKEN_COOKIE).path).toBe('/api/auth');
  });

  it('gives the refresh cookie a longer life than the access cookie', () => {
    serviceFor('production').setAuthCookies(res as unknown as Response, tokens);

    expect(optionsFor(REFRESH_TOKEN_COOKIE).maxAge).toBeGreaterThan(
      optionsFor(ACCESS_TOKEN_COOKIE).maxAge,
    );
  });

  describe('clearAuthCookies', () => {
    // Der Fallstrick beim Logout: Weichen path/sameSite/secure vom Setzen ab,
    // löscht der Browser NICHTS - der Nutzer bliebe angemeldet, obwohl er
    // abgemeldet zu sein glaubt.
    it('clears with exactly the attributes used when setting', () => {
      const service = serviceFor('production');
      service.setAuthCookies(res as unknown as Response, tokens);
      service.clearAuthCookies(res as unknown as Response);

      for (const name of [ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE]) {
        const setOptions = optionsFor(name);
        const clearOptions = res.clearCookie.mock.calls.find(
          (call) => call[0] === name,
        )?.[1];

        expect(clearOptions.path).toBe(setOptions.path);
        expect(clearOptions.sameSite).toBe(setOptions.sameSite);
        expect(clearOptions.secure).toBe(setOptions.secure);
        expect(clearOptions.httpOnly).toBe(setOptions.httpOnly);
      }
    });

    it('clears both cookies', () => {
      serviceFor('production').clearAuthCookies(res as unknown as Response);

      expect(res.clearCookie).toHaveBeenCalledTimes(2);
    });
  });
});
