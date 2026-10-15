import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import * as Sentry from '@sentry/node';
import { AppModule } from './app.module';
import { sanitizeSentryEvent } from './shared';
import { validateEnv, configureApp } from './configure-app';

async function bootstrap(): Promise<void> {
  validateEnv();

  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      beforeSend(event) {
        return sanitizeSentryEvent(event);
      },
    });
  }

  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const logger = app.get(Logger);
  app.useLogger(logger);

  // Configuración transversal unificada (Seguridad, Cookies, CORS, Prefijo v1, Filtros y Pipes)
  configureApp(app);

  // Documentación de OpenAPI en /docs (RNF-B-040)
  const config = new DocumentBuilder()
    .setTitle('Sistema Odontológico API')
    .setDescription('API REST del Sistema de Gestión para Consultorio Odontológico')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Servidor iniciado en puerto ${port} (docs en /docs)`);
}

bootstrap();
