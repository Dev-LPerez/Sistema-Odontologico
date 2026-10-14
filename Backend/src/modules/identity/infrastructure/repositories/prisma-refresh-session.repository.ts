import { Injectable } from '@nestjs/common';
import { RefreshSessionRepositoryPort } from '../../domain/refresh-session.repository.port';
import { RefreshSession } from '../../domain/refresh-session.entity';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { RefreshSessionMapper } from '../mappers/refresh-session.mapper';

@Injectable()
export class PrismaRefreshSessionRepository implements RefreshSessionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByTokenHash(tokenHash: string): Promise<RefreshSession | null> {
    const raw = await this.prisma.client.refreshSession.findUnique({
      where: { tokenHash },
    });
    return raw ? RefreshSessionMapper.toDomain(raw) : null;
  }

  async save(session: RefreshSession): Promise<void> {
    const data = RefreshSessionMapper.toPersistence(session);
    await this.prisma.client.refreshSession.upsert({
      where: { id: session.id },
      create: data,
      update: data,
    });
  }

  async revokeAllForUser(userId: string, revokedAt: Date): Promise<void> {
    await this.prisma.client.refreshSession.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt,
      },
    });
  }
}
