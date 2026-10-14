import { RefreshSession as PrismaRefreshSession, Prisma } from '@prisma/client';
import { RefreshSession } from '../../domain/refresh-session.entity';

export class RefreshSessionMapper {
  static toDomain(raw: PrismaRefreshSession): RefreshSession {
    return RefreshSession.create({
      id: raw.id,
      clinicId: raw.clinicId,
      userId: raw.userId,
      tokenHash: raw.tokenHash,
      expiresAt: raw.expiresAt,
      revokedAt: raw.revokedAt,
      createdAt: raw.createdAt,
    });
  }

  static toPersistence(domain: RefreshSession): Prisma.RefreshSessionUncheckedCreateInput {
    return {
      id: domain.id,
      clinicId: domain.clinicId,
      userId: domain.userId,
      tokenHash: domain.tokenHash,
      expiresAt: domain.expiresAt,
      revokedAt: domain.revokedAt,
      createdAt: domain.createdAt,
    };
  }
}
