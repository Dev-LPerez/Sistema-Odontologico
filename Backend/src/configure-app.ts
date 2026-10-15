import { INestApplication, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { DomainExceptionFilter } from './shared/presentation/filters/domain-exception.filter';

export function validateEnv(): void {
  const requiredEnvVars = ['DATABASE_URL'];
  const missingVars = requiredEnvVars.filter((v) => !process.env[v]);

  if (missingVars.length > 0) {
    throw new Error(`Variables de entorno requeridas no configuradas: ${missingVars.join(', ')}`);
  }

  if (process.env.NODE_ENV === 'production') {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET debe estar configurado en entorno de producción');
    }
    const corsOrigin = process.env.CORS_ORIGIN;
    if (!corsOrigin || corsOrigin === '*') {
      throw new Error(
        'CORS_ORIGIN debe estar configurado con un origen explícito y no puede ser "*" en entorno de producción',
      );
    }
  }
}

export function configureApp(app: INestApplication): INestApplication {
  app.use(helmet());
  app.use(cookieParser());

  const origin = process.env.CORS_ORIGIN || 'http://localhost:5173';
  app.enableCors({
    origin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.setGlobalPrefix('v1', { exclude: ['health', 'ready'] });
  app.useGlobalFilters(new DomainExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  return app;
}
