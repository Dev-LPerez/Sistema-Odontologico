import { HttpStatus } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaService } from '../shared/infrastructure/prisma/prisma.service';
import { Response } from 'express';

describe('HealthController', () => {
  let controller: HealthController;
  let mockPrismaService: { isHealthy: jest.Mock };

  beforeEach(() => {
    mockPrismaService = {
      isHealthy: jest.fn(),
    };
    controller = new HealthController(mockPrismaService as unknown as PrismaService);
  });

  describe('getHealth', () => {
    it('debe retornar { status: "ok" }', () => {
      const result = controller.getHealth();
      expect(result).toEqual({ status: 'ok' });
    });
  });

  describe('getReady', () => {
    let mockResponse: Partial<Response>;

    beforeEach(() => {
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
    });

    it('debe responder 200 OK con { status: "ready", database: "up" } si la BD está saludable', async () => {
      mockPrismaService.isHealthy.mockResolvedValueOnce(true);

      await controller.getReady(mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'ready',
        database: 'up',
      });
    });

    it('debe responder 503 Service Unavailable si la BD no está saludable', async () => {
      mockPrismaService.isHealthy.mockResolvedValueOnce(false);

      await controller.getReady(mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'down',
        database: 'down',
      });
    });
  });
});
