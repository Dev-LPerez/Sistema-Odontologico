import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/shared/infrastructure/prisma/prisma.service';

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
    app.setGlobalPrefix('v1', { exclude: ['health', 'ready'] });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /health (Liveness)', () => {
    it('debe responder 200 OK con { status: "ok" } sin consultar la base de datos', async () => {
      const response = await request(app.getHttpServer()).get('/health').expect(200);

      expect(response.body).toEqual({ status: 'ok' });
      expect(mockPrismaService.isHealthy).not.toHaveBeenCalled();
    });
  });

  describe('GET /ready (Readiness)', () => {
    it('debe responder 200 OK con { status: "ready", database: "up" } cuando la BD está disponible', async () => {
      mockPrismaService.isHealthy.mockResolvedValueOnce(true);

      const response = await request(app.getHttpServer()).get('/ready').expect(200);

      expect(response.body).toEqual({ status: 'ready', database: 'up' });
      expect(mockPrismaService.isHealthy).toHaveBeenCalled();
    });

    it('debe responder 503 Service Unavailable cuando la base de datos falla', async () => {
      mockPrismaService.isHealthy.mockResolvedValueOnce(false);

      const response = await request(app.getHttpServer()).get('/ready').expect(503);

      expect(response.body).toEqual({ status: 'down', database: 'down' });
    });
  });
});
