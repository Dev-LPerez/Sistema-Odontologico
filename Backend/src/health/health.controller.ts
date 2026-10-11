import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { PrismaService } from '../shared/infrastructure/prisma/prisma.service';

@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(private readonly prismaService: PrismaService) {}

  @Get('health')
  @ApiOperation({ summary: 'Liveness probe (comprueba si el proceso está activo)' })
  @ApiResponse({ status: 200, description: 'Servidor activo en memoria' })
  getHealth(): { status: string } {
    return { status: 'ok' };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe (comprueba conectividad con PostgreSQL)' })
  @ApiResponse({ status: 200, description: 'Base de datos disponible' })
  @ApiResponse({ status: 503, description: 'Base de datos no disponible' })
  async getReady(@Res() res: Response): Promise<Response> {
    const isDbHealthy = await this.prismaService.isHealthy();

    if (!isDbHealthy) {
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        status: 'down',
        database: 'down',
      });
    }

    return res.status(HttpStatus.OK).json({
      status: 'ready',
      database: 'up',
    });
  }
}
