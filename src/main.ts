import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { json } from 'express';

import { AppModule } from './app.module';
import { ErrorGeneradorFilter } from './infrastructure/rest/error-generador.filter';

async function bootstrap() {
  // Facturas con muchos detalles superan los 100kb que trae Nest por defecto.
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  app.use(json({ limit: process.env.XML_GENERATOR_MAX_BODY ?? '10mb' }));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  app.useGlobalFilters(new ErrorGeneradorFilter());

  const puerto = Number(process.env.PORT ?? 3002);
  await app.listen(puerto, '0.0.0.0');

  new Logger('Bootstrap').log(`xml-generator-service escuchando en :${puerto}`);
}

void bootstrap();
