import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import {
  PASSWORD_HASHER,
  TOKEN_HASHER,
  TOKEN_ISSUER,
  USER_REPOSITORY,
} from '@stitchlab-yvr/backend-auth-domain';
import { AuthConfig } from './config/auth.config.js';
import { PrismaUserRepository } from './repositories/prisma-user.repository.js';
import { BcryptPasswordHasher } from './services/bcrypt-password-hasher.js';
import { JwtTokenIssuer } from './services/jwt-token-issuer.js';
import { Sha256TokenHasher } from './services/sha256-token-hasher.js';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';

/**
 * Bindet die drei Ports der Auth-Domaene an ihre technischen Umsetzungen und
 * registriert die beiden Passport-Strategien.
 *
 * `JwtModule.register({})` bleibt leer: Die Schluessel werden pro Signatur
 * uebergeben (`JwtTokenIssuer`), weil Access- und Refresh-Token bewusst
 * VERSCHIEDENE Secrets nutzen - ein global gesetztes Secret waere hier falsch.
 *
 * `@Global()`, damit das AppModule es einmal registriert und alle Handler die
 * Token sehen, ohne dass die Anwendungsschicht dieses Modul importieren muesste.
 * Exportiert wird auch `AuthConfig`: Die Adapter-Schicht braucht daraus die
 * Cookie-Laufzeiten.
 */
@Global()
@Module({
  imports: [ConfigModule, PassportModule, JwtModule.register({})],
  providers: [
    AuthConfig,
    JwtStrategy,
    JwtRefreshStrategy,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: TOKEN_ISSUER, useClass: JwtTokenIssuer },
    { provide: TOKEN_HASHER, useClass: Sha256TokenHasher },
  ],
  exports: [
    USER_REPOSITORY,
    PASSWORD_HASHER,
    TOKEN_ISSUER,
    TOKEN_HASHER,
    AuthConfig,
  ],
})
export class BackendAuthInfrastructureModule {}
