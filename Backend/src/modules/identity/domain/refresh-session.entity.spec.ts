import { RefreshSession } from './refresh-session.entity';

describe('RefreshSession Entity', () => {
  const createdAt = new Date('2026-10-13T10:00:00.000Z');
  const expiresAt = new Date('2026-10-20T10:00:00.000Z');

  it('debe instanciar una sesión válida no revocada y no expirada', () => {
    const session = RefreshSession.create({
      id: 'session-001',
      clinicId: 'clinic-123',
      userId: 'user-001',
      tokenHash: 'sha256-hash-xyz',
      expiresAt,
      createdAt,
    });

    const now = new Date('2026-10-13T12:00:00.000Z');
    expect(session.id).toBe('session-001');
    expect(session.clinicId).toBe('clinic-123');
    expect(session.userId).toBe('user-001');
    expect(session.tokenHash).toBe('sha256-hash-xyz');
    expect(session.isRevoked()).toBe(false);
    expect(session.isExpired(now)).toBe(false);
    expect(session.isValid(now)).toBe(true);
  });

  it('debe identificar una sesión expirada', () => {
    const session = RefreshSession.create({
      id: 'session-002',
      clinicId: 'clinic-123',
      userId: 'user-001',
      tokenHash: 'sha256-hash-expired',
      expiresAt,
      createdAt,
    });

    const futureTime = new Date('2026-10-21T10:00:00.000Z');
    expect(session.isExpired(futureTime)).toBe(true);
    expect(session.isValid(futureTime)).toBe(false);
  });

  it('debe revocar la sesión y marcarla como inválida', () => {
    const session = RefreshSession.create({
      id: 'session-003',
      clinicId: 'clinic-123',
      userId: 'user-001',
      tokenHash: 'sha256-hash-revoked',
      expiresAt,
      createdAt,
    });

    const revokeTime = new Date('2026-10-13T16:00:00.000Z');
    session.revoke(revokeTime);

    expect(session.isRevoked()).toBe(true);
    expect(session.revokedAt).toEqual(revokeTime);
    expect(session.isValid(new Date('2026-10-13T17:00:00.000Z'))).toBe(false);
  });
});
