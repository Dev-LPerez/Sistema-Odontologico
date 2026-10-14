import { RefreshSession } from './refresh-session.entity';

export const REFRESH_SESSION_REPOSITORY_PORT = Symbol('REFRESH_SESSION_REPOSITORY_PORT');

export interface RefreshSessionRepositoryPort {
  findByTokenHash(tokenHash: string): Promise<RefreshSession | null>;
  save(session: RefreshSession): Promise<void>;
  revokeAllForUser(userId: string, revokedAt: Date): Promise<void>;
}
