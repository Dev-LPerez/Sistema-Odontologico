import { RefreshSessionUseCase } from './refresh-session.use-case';
import { User } from '../../domain/user.entity';
import { RefreshSession } from '../../domain/refresh-session.entity';
import { Email } from '../../domain/email.vo';
import { UserRole } from '../../domain/role.enum';
import { InvalidRefreshTokenError } from '../../domain/identity.errors';
import { UserRepositoryPort } from '../../domain/user.repository.port';
import { RefreshSessionRepositoryPort } from '../../domain/refresh-session.repository.port';
import { TokenServicePort } from '../ports/token-service.port';
import { ClockPort } from '../../../../shared/application/ports/clock.port';
import { IdGeneratorPort } from '../../../../shared/application/ports/id-generator.port';

describe('RefreshSessionUseCase', () => {
  let useCase: RefreshSessionUseCase;
  let mockUserRepo: jest.Mocked<UserRepositoryPort>;
  let mockRefreshSessionRepo: jest.Mocked<RefreshSessionRepositoryPort>;
  let mockTokenService: jest.Mocked<TokenServicePort>;
  let mockClock: jest.Mocked<ClockPort>;
  let mockIdGenerator: jest.Mocked<IdGeneratorPort>;

  const now = new Date('2026-10-13T12:00:00.000Z');
  const validUser = User.create({
    id: 'user-001',
    clinicId: 'clinic-123',
    email: Email.create('dra.angelee@consultorio.com'),
    passwordHash: 'hash',
    fullName: 'Dra. Angelee Pacheco',
    role: UserRole.ADMIN,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  const validSession = RefreshSession.create({
    id: 'session-001',
    clinicId: 'clinic-123',
    userId: 'user-001',
    tokenHash: 'hash-of-old-refresh-token',
    expiresAt: new Date('2026-10-20T12:00:00.000Z'),
    createdAt: now,
  });

  beforeEach(() => {
    mockUserRepo = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
    };
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
    mockIdGenerator = {
      generate: jest.fn().mockReturnValue('new-session-uuid-002'),
    };

    useCase = new RefreshSessionUseCase(
      mockUserRepo,
      mockRefreshSessionRepo,
      mockTokenService,
      mockClock,
      mockIdGenerator,
    );
  });

  it('debe rotar el refresh token, revocar la sesión anterior y emitir nuevo accessToken', async () => {
    mockTokenService.hashRefreshToken.mockReturnValueOnce('hash-of-old-refresh-token');
    mockRefreshSessionRepo.findByTokenHash.mockResolvedValueOnce(validSession);
    mockUserRepo.findById.mockResolvedValueOnce(validUser);
    mockTokenService.generateRefreshToken.mockReturnValueOnce({
      token: 'brand-new-refresh-token',
      tokenHash: 'hash-of-new-refresh-token',
      expiresAt: new Date('2026-10-20T12:00:00.000Z'),
    });
    mockTokenService.signAccessToken.mockResolvedValueOnce('new.jwt.access-token');

    const result = await useCase.execute({ refreshToken: 'old-raw-refresh-token' });

    expect(result.accessToken).toBe('new.jwt.access-token');
    expect(result.newRefreshToken).toBe('brand-new-refresh-token');
    expect(result.user.email).toBe('dra.angelee@consultorio.com');

    // Sesión anterior revocada
    expect(validSession.isRevoked()).toBe(true);
    expect(mockRefreshSessionRepo.save).toHaveBeenCalledWith(validSession);

    // Nueva sesión creada
    expect(mockRefreshSessionRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'new-session-uuid-002',
        tokenHash: 'hash-of-new-refresh-token',
      }),
    );
  });

  it('debe lanzar InvalidRefreshTokenError si no se proporciona el token de refresco', async () => {
    await expect(useCase.execute({ refreshToken: '' })).rejects.toThrow(InvalidRefreshTokenError);
  });

  it('debe lanzar InvalidRefreshTokenError si la sesión no existe en la base de datos', async () => {
    mockTokenService.hashRefreshToken.mockReturnValueOnce('hash-inexistente');
    mockRefreshSessionRepo.findByTokenHash.mockResolvedValueOnce(null);

    await expect(useCase.execute({ refreshToken: 'inexistente' })).rejects.toThrow(
      InvalidRefreshTokenError,
    );
  });

  it('debe lanzar InvalidRefreshTokenError si la sesión ya fue revocada', async () => {
    const revokedSession = RefreshSession.create({
      id: 'session-revoked',
      clinicId: 'clinic-123',
      userId: 'user-001',
      tokenHash: 'hash-revoked',
      expiresAt: new Date('2026-10-20T12:00:00.000Z'),
      revokedAt: new Date('2026-10-13T11:00:00.000Z'),
      createdAt: now,
    });

    mockTokenService.hashRefreshToken.mockReturnValueOnce('hash-revoked');
    mockRefreshSessionRepo.findByTokenHash.mockResolvedValueOnce(revokedSession);

    await expect(useCase.execute({ refreshToken: 'revoked' })).rejects.toThrow(
      InvalidRefreshTokenError,
    );
  });

  it('debe lanzar InvalidRefreshTokenError si el usuario está inactivo o no existe', async () => {
    mockTokenService.hashRefreshToken.mockReturnValueOnce('hash-valido');
    mockRefreshSessionRepo.findByTokenHash.mockResolvedValueOnce(validSession);
    mockUserRepo.findById.mockResolvedValueOnce(null);

    await expect(useCase.execute({ refreshToken: 'token' })).rejects.toThrow(
      InvalidRefreshTokenError,
    );
  });
});
