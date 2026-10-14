import { LoginUseCase } from './login.use-case';
import { User } from '../../domain/user.entity';
import { Email } from '../../domain/email.vo';
import { UserRole } from '../../domain/role.enum';
import {
  InvalidCredentialsError,
  UserInactiveError,
  InvalidEmailError,
} from '../../domain/identity.errors';
import { UserRepositoryPort } from '../../domain/user.repository.port';
import { RefreshSessionRepositoryPort } from '../../domain/refresh-session.repository.port';
import { PasswordHasherPort } from '../ports/password-hasher.port';
import { TokenServicePort } from '../ports/token-service.port';
import { ClockPort } from '../../../../shared/application/ports/clock.port';
import { IdGeneratorPort } from '../../../../shared/application/ports/id-generator.port';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let mockUserRepo: jest.Mocked<UserRepositoryPort>;
  let mockRefreshSessionRepo: jest.Mocked<RefreshSessionRepositoryPort>;
  let mockPasswordHasher: jest.Mocked<PasswordHasherPort>;
  let mockTokenService: jest.Mocked<TokenServicePort>;
  let mockClock: jest.Mocked<ClockPort>;
  let mockIdGenerator: jest.Mocked<IdGeneratorPort>;

  const fixedDate = new Date('2026-10-13T10:00:00.000Z');
  const validUser = User.create({
    id: 'user-001',
    clinicId: 'clinic-123',
    email: Email.create('dra.angelee@consultorio.com'),
    passwordHash: 'hashed-secret',
    fullName: 'Dra. Angelee Pacheco',
    role: UserRole.ADMIN,
    isActive: true,
    createdAt: fixedDate,
    updatedAt: fixedDate,
  });

  beforeEach(() => {
    mockUserRepo = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAllByClinicId: jest.fn(),
      save: jest.fn(),
    };

    mockRefreshSessionRepo = {
      findByTokenHash: jest.fn(),
      save: jest.fn(),
      revokeAllForUser: jest.fn(),
    };
    mockPasswordHasher = {
      hash: jest.fn(),
      verify: jest.fn(),
    };
    mockTokenService = {
      signAccessToken: jest.fn(),
      verifyAccessToken: jest.fn(),
      generateRefreshToken: jest.fn(),
      hashRefreshToken: jest.fn(),
    };
    mockClock = {
      now: jest.fn().mockReturnValue(fixedDate),
      todayInBogota: jest.fn().mockReturnValue('2026-10-13'),
      formatInBogota: jest.fn().mockReturnValue('2026-10-13'),
      isSameDayInBogota: jest.fn().mockReturnValue(true),
    };
    mockIdGenerator = {
      generate: jest.fn().mockReturnValue('session-uuid-999'),
    };

    useCase = new LoginUseCase(
      mockUserRepo,
      mockRefreshSessionRepo,
      mockPasswordHasher,
      mockTokenService,
      mockClock,
      mockIdGenerator,
    );
  });

  it('debe autenticar con éxito y devolver usuario, accessToken y refreshToken', async () => {
    mockUserRepo.findByEmail.mockResolvedValueOnce(validUser);
    mockPasswordHasher.verify.mockResolvedValueOnce(true);
    mockTokenService.generateRefreshToken.mockReturnValueOnce({
      token: 'raw-refresh-token-123',
      tokenHash: 'sha256-refresh-hash',
      expiresAt: new Date('2026-10-20T10:00:00.000Z'),
    });
    mockTokenService.signAccessToken.mockResolvedValueOnce('signed.jwt.access-token');

    const result = await useCase.execute({
      email: 'dra.angelee@consultorio.com',
      password: 'correct-password',
    });

    expect(result.user).toEqual({
      id: 'user-001',
      clinicId: 'clinic-123',
      email: 'dra.angelee@consultorio.com',
      fullName: 'Dra. Angelee Pacheco',
      role: UserRole.ADMIN,
    });
    expect(result.accessToken).toBe('signed.jwt.access-token');
    expect(result.refreshToken).toBe('raw-refresh-token-123');

    expect(mockRefreshSessionRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'session-uuid-999',
        clinicId: 'clinic-123',
        userId: 'user-001',
        tokenHash: 'sha256-refresh-hash',
      }),
    );
  });

  it('debe lanzar InvalidCredentialsError si el usuario no existe', async () => {
    mockUserRepo.findByEmail.mockResolvedValueOnce(null);

    await expect(
      useCase.execute({
        email: 'no-existe@consultorio.com',
        password: 'password',
      }),
    ).rejects.toThrow(InvalidCredentialsError);

    expect(mockPasswordHasher.verify).not.toHaveBeenCalled();
  });

  it('debe lanzar InvalidCredentialsError si la contraseña no coincide', async () => {
    mockUserRepo.findByEmail.mockResolvedValueOnce(validUser);
    mockPasswordHasher.verify.mockResolvedValueOnce(false);

    await expect(
      useCase.execute({
        email: 'dra.angelee@consultorio.com',
        password: 'wrong-password',
      }),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it('debe lanzar UserInactiveError si el usuario está inactivo', async () => {
    const inactiveUser = User.create({
      id: 'user-002',
      clinicId: 'clinic-123',
      email: Email.create('inactivo@consultorio.com'),
      passwordHash: 'hashed-secret',
      fullName: 'Usuario Inactivo',
      role: UserRole.AUXILIARY,
      isActive: false,
      createdAt: fixedDate,
      updatedAt: fixedDate,
    });

    mockUserRepo.findByEmail.mockResolvedValueOnce(inactiveUser);

    await expect(
      useCase.execute({
        email: 'inactivo@consultorio.com',
        password: 'password',
      }),
    ).rejects.toThrow(UserInactiveError);
  });

  it('debe lanzar InvalidEmailError si el formato de correo es inválido', async () => {
    await expect(
      useCase.execute({
        email: 'correo-invalido',
        password: 'password',
      }),
    ).rejects.toThrow(InvalidEmailError);
  });
});
