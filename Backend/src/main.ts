import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

function validateEnv(): void {
  const requiredEnvVars = ['DATABASE_URL'];
  const missingVars = requiredEnvVars.filter((v) => !process.env[v]);

  if (missingVars.length > 0) {
    throw new Error(`Variables de entorno requeridas no configuradas: ${missingVars.join(', ')}`);
  }
}

async function bootstrap(): Promise<void> {
  validateEnv();

  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const logger = app.get(Logger);
  app.useLogger(logger);

  // Seguridad HTTP (RNF-B-005, RNF-B-006)
  app.use(helmet());
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Excluir endpoints operativos de salud del prefijo /v1
  app.setGlobalPrefix('v1', { exclude: ['health', 'ready'] });

  // Validación de entrada con class-validator (RNF-B-005)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

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
