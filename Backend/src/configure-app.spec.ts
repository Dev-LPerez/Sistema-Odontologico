import { INestApplication } from '@nestjs/common';
import { validateEnv, configureApp } from './configure-app';
import { DomainExceptionFilter } from './shared/presentation/filters/domain-exception.filter';

describe('configureApp and validateEnv (RNF-B-005, RNF-B-006)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('validateEnv', () => {
    it('debe fallar si falta DATABASE_URL', () => {
      delete process.env.DATABASE_URL;
      expect(() => validateEnv()).toThrow('DATABASE_URL');
    });

    it('debe pasar si DATABASE_URL existe en desarrollo', () => {
      process.env.DATABASE_URL = 'postgresql://localhost:5432/db';
      process.env.NODE_ENV = 'development';
      expect(() => validateEnv()).not.toThrow();
    });

    it('debe fallar en producción si falta JWT_SECRET', () => {
      process.env.DATABASE_URL = 'postgresql://localhost:5432/db';
      process.env.NODE_ENV = 'production';
      delete process.env.JWT_SECRET;
      process.env.CORS_ORIGIN = 'https://clinica.com';

      expect(() => validateEnv()).toThrow('JWT_SECRET');
    });

    it('debe fallar en producción si falta CORS_ORIGIN o si es *', () => {
      process.env.DATABASE_URL = 'postgresql://localhost:5432/db';
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'super-secret-jwt-key';

      delete process.env.CORS_ORIGIN;
      expect(() => validateEnv()).toThrow('CORS_ORIGIN');

      process.env.CORS_ORIGIN = '*';
      expect(() => validateEnv()).toThrow('CORS_ORIGIN');
    });

    it('debe pasar en producción si todas las variables requeridas están configuradas correctamente', () => {
      process.env.DATABASE_URL = 'postgresql://localhost:5432/db';
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'super-secret-jwt-key';
      process.env.CORS_ORIGIN = 'https://clinica.com';

      expect(() => validateEnv()).not.toThrow();
    });
  });

  describe('configureApp', () => {
    it('debe registrar helmet, cookieParser, CORS, prefijo v1, DomainExceptionFilter y ValidationPipe', () => {
      const mockApp = {
        use: jest.fn(),
        enableCors: jest.fn(),
        setGlobalPrefix: jest.fn(),
        useGlobalFilters: jest.fn(),
        useGlobalPipes: jest.fn(),
      } as unknown as INestApplication;

      process.env.CORS_ORIGIN = 'https://app.clinica.com';

      const returnedApp = configureApp(mockApp);

      expect(returnedApp).toBe(mockApp);
      expect(mockApp.use).toHaveBeenCalledTimes(2); // helmet y cookieParser
      expect(mockApp.enableCors).toHaveBeenCalledWith(
        expect.objectContaining({
          origin: 'https://app.clinica.com',
          credentials: true,
        }),
      );
      expect(mockApp.setGlobalPrefix).toHaveBeenCalledWith('v1', {
        exclude: ['health', 'ready'],
      });
      expect(mockApp.useGlobalFilters).toHaveBeenCalledWith(expect.any(DomainExceptionFilter));
      expect(mockApp.useGlobalPipes).toHaveBeenCalledWith(expect.any(Object));
    });

    it('debe usar http://localhost:5173 como origen CORS por defecto si CORS_ORIGIN no está definido', () => {
      const mockApp = {
        use: jest.fn(),
        enableCors: jest.fn(),
        setGlobalPrefix: jest.fn(),
        useGlobalFilters: jest.fn(),
        useGlobalPipes: jest.fn(),
      } as unknown as INestApplication;

      delete process.env.CORS_ORIGIN;

      configureApp(mockApp);

      expect(mockApp.enableCors).toHaveBeenCalledWith(
        expect.objectContaining({
          origin: 'http://localhost:5173',
          credentials: true,
        }),
      );
    });
  });
});
