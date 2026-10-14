import { Injectable } from '@nestjs/common';
import { RefreshSessionRepositoryPort } from '../../domain/refresh-session.repository.port';
import { RefreshSession } from '../../domain/refresh-session.entity';

@Injectable()
export class InMemoryRefreshSessionRepository implements RefreshSessionRepositoryPort {
  private readonly items = new Map<string, RefreshSession>();

  async findByTokenHash(tokenHash: string): Promise<RefreshSession | null> {
    for (const session of this.items.values()) {
      if (session.tokenHash === tokenHash) {
        return session;
      }
    }
    return null;
  }

  async save(session: RefreshSession): Promise<void> {
    this.items.set(session.id, session);
  }

  async revokeAllForUser(userId: string, revokedAt: Date): Promise<void> {
    for (const session of this.items.values()) {
      if (session.userId === userId && !session.isRevoked()) {
        session.revoke(revokedAt);
      }
    }
  }

  clear(): void {
    this.items.clear();
  }
}
