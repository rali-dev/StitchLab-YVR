import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import {
  DomainException,
  ResourceConflictException,
  ResourceNotFoundException,
} from '@stitchlab-yvr/shared-contracts';

/**
 * Uebersetzt Domaenenfehler in HTTP-Status-Codes.
 *
 * Das ist der Grund, warum `DomainException` nichts von HTTP wissen muss: die
 * Domaene sagt WAS falsch ist, dieser Filter entscheidet, wie das ueber HTTP
 * klingt. Er sitzt in der App und nicht in einer Domaenen-Bibliothek, weil er
 * fuer jede kuenftige Domaene gleichermassen gilt.
 *
 * Zuordnung:
 * - `ResourceNotFoundException` -> 404
 * - `ResourceConflictException` -> 409
 * - jede andere `DomainException` -> 400 (verletzte Geschaeftsregel)
 */
@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter<DomainException> {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  // Ueber den HttpAdapter statt direkt ueber Express: so bleibt der Filter
  // unabhaengig von der eingesetzten HTTP-Plattform.
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: DomainException, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const context = host.switchToHttp();
    const status = DomainExceptionFilter.toStatus(exception);

    // Auf `debug`, nicht auf `error`: ein abgelehnter Slug ist ein normaler
    // Vorgang und darf die Logs nicht mit Alarmen fuellen.
    this.logger.debug(`${exception.name} -> ${status}: ${exception.message}`);

    httpAdapter.reply(
      context.getResponse(),
      {
        statusCode: status,
        message: exception.message,
        error: exception.name,
      },
      status,
    );
  }

  private static toStatus(exception: DomainException): HttpStatus {
    if (exception instanceof ResourceNotFoundException) {
      return HttpStatus.NOT_FOUND;
    }
    if (exception instanceof ResourceConflictException) {
      return HttpStatus.CONFLICT;
    }

    return HttpStatus.BAD_REQUEST;
  }
}
