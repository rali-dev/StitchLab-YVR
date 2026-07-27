import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  app.useGlobalPipes(
    new ValidationPipe({
      // Felder, die in keinem DTO stehen, werden entfernt...
      whitelist: true,
      // ...und wenn welche mitgeschickt wurden, wird die Anfrage abgelehnt.
      // Lieber ein klares 400 als ein stilles Ignorieren: ein vertippter
      // Feldname faellt so sofort auf, statt sich als "die Aenderung wirkt
      // nicht" zu tarnen.
      forbidNonWhitelisted: true,
      // Wandelt den rohen JSON-Koerper in die DTO-Klasse um. Ohne das laufen
      // weder `@Transform` noch die typbasierten Pruefungen.
      transform: true,
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
}

bootstrap();
