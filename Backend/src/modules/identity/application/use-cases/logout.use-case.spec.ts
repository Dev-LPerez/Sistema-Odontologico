import { LogoutUseCase } from './logout.use-case';
import { RefreshSession } from '../../domain/refresh-session.entity';
import { RefreshSessionRepositoryPort } from '../../domain/refresh-session.repository.port';
import { TokenServicePort } from '../ports/token-service.port';
import { ClockPort } from '../../../../shared/application/ports/clock.port';

describe('LogoutUseCase', () => {
  let useCase: LogoutUseCase;
  let mockRefreshSessionRepo: jest.Mocked<RefreshSessionRepositoryPort>;
  let mockTokenService: jest.Mocked<TokenServicePort>;
  let mockClock: jest.Mocked<ClockPort>;

  const now = new Date('2026-10-13T12:00:00.000Z');

  beforeEach(() => {
    mockRefreshSessionRepo = {
      findByTokenHash: jest.fn(),
      save: jest.fn(),
      revokeAllForUser: jest.fn(),
    };
    mockTokenService = {
      signAccessToken: jest.fn(),
      verifyAccessToken: jest.fn(),
      generateRefreshToken: jest.fn(),
      hashRefreshToken: jest.fn(),
    };
    mockClock = {
      now: jest.fn().mockReturnValue(now),
      todayInBogota: jest.fn().mockReturnValue('2026-10-13'),
      formatInBogota: jest.fn().mockReturnValue('2026-10-13'),
      isSameDayInBogota: jest.fn().mockReturnValue(true),
    };

    useCase = new LogoutUseCase(mockRefreshSessionRepo, mockTokenService, mockClock);
  });

  it('debe revocar la sesión activa correspondiente al refreshToken', async () => {
    const session = RefreshSession.create({
      id: 'session-001',
      clinicId: 'clinic-123',
      userId: 'user-001',
      tokenHash: 'hash-of-active-token',
      expiresAt: new Date('2026-10-20T12:00:00.000Z'),
      createdAt: now,
    });

    mockTokenService.hashRefreshToken.mockReturnValueOnce('hash-of-active-token');
    mockRefreshSessionRepo.findByTokenHash.mockResolvedValueOnce(session);

    await useCase.execute({ refreshToken: 'raw-active-token' });

    expect(session.isRevoked()).toBe(true);
    expect(mockRefreshSessionRepo.save).toHaveBeenCalledWith(session);
  });

  it('debe ser idempotente si no se envía refreshToken o no se encuentra la sesión', async () => {
    await useCase.execute({});
    expect(mockRefreshSessionRepo.findByTokenHash).not.toHaveBeenCalled();

    mockTokenService.hashRefreshToken.mockReturnValueOnce('hash-inexistente');
    mockRefreshSessionRepo.findByTokenHash.mockResolvedValueOnce(null);

    await useCase.execute({ refreshToken: 'desconocido' });
    expect(mockRefreshSessionRepo.save).not.toHaveBeenCalled();
  });
});
