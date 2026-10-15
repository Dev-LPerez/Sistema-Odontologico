import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/shared/infrastructure/prisma/prisma.service';
import { configureApp } from '../src/configure-app';

describe('Health & Readiness Endpoints (e2e)', () => {
  let app: INestApplication;
  const mockPrismaService = {
    isHealthy: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /health (Liveness)', () => {
    it('debe responder 200 OK con { status: "ok" } sin consultar la base de datos y retornar x-correlation-id generado', async () => {
      const response = await request(app.getHttpServer()).get('/health').expect(200);

      expect(response.body).toEqual({ status: 'ok' });
      expect(mockPrismaService.isHealthy).not.toHaveBeenCalled();
      expect(response.headers['x-correlation-id']).toBeDefined();
      expect(response.headers['x-correlation-id']).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it('debe propagar la cabecera x-correlation-id si el cliente la envía', async () => {
      const clientCorrelationId = 'client-corr-id-12345';
      const response = await request(app.getHttpServer())
        .get('/health')
        .set('x-correlation-id', clientCorrelationId)
        .expect(200);

      expect(response.headers['x-correlation-id']).toBe(clientCorrelationId);
    });
  });

  describe('GET /ready (Readiness)', () => {
    it('debe responder 200 OK con { status: "ready", database: "up" } e incluir x-correlation-id cuando la BD está disponible', async () => {
      mockPrismaService.isHealthy.mockResolvedValueOnce(true);

      const response = await request(app.getHttpServer()).get('/ready').expect(200);

      expect(response.body).toEqual({ status: 'ready', database: 'up' });
      expect(mockPrismaService.isHealthy).toHaveBeenCalled();
      expect(response.headers['x-correlation-id']).toBeDefined();
    });

    it('debe responder 503 Service Unavailable e incluir x-correlation-id cuando la base de datos falla', async () => {
      mockPrismaService.isHealthy.mockResolvedValueOnce(false);

      const response = await request(app.getHttpServer()).get('/ready').expect(503);

      expect(response.body).toEqual({ status: 'down', database: 'down' });
      expect(response.headers['x-correlation-id']).toBeDefined();
    });
  });
});
