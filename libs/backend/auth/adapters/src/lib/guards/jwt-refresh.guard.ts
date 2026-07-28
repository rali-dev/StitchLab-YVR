import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Schützt ausschließlich `POST /api/auth/refresh`.
 *
 * Nutzt die zweite Strategie mit dem zweiten Schlüssel. Ein Access-Token kommt
 * hier nicht durch (falsche Signatur) und ein Refresh-Token nirgendwo sonst -
 * genau das ist der Zweck der getrennten Secrets.
 */
@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {}
