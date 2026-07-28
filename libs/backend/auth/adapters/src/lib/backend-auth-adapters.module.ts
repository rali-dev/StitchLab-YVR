import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BackendAuthApplicationModule } from '@stitchlab-yvr/backend-auth-application';
import { AuthController } from './controllers/auth.controller.js';
import { AuthCookieService } from './services/auth-cookie.service.js';

/**
 * HTTP-Zugang der Auth-Domaene.
 *
 * Die Guards werden hier NICHT als Provider gefuehrt: `AuthGuard('jwt')` loest
 * seine Strategie ueber den Namen auf, den das Infrastructure-Modul registriert
 * hat. Sie werden nur exportiert, damit andere Domaenen sie an ihre Routen
 * haengen koennen (siehe ProductController).
 */
@Module({
  imports: [ConfigModule, BackendAuthApplicationModule],
  controllers: [AuthController],
  providers: [AuthCookieService],
})
export class BackendAuthAdaptersModule {}
