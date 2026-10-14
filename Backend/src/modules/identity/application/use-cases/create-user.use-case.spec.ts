import { CreateUserUseCase, CreateUserCommand } from './create-user.use-case';
import { UserRepositoryPort } from '../../domain/user.repository.port';
import { PasswordHasherPort } from '../ports/password-hasher.port';
import { ClockPort } from '../../../../shared/application/ports/clock.port';
import { IdGeneratorPort } from '../../../../shared/application/ports/id-generator.port';
import { UserRole } from '../../domain/role.enum';
import { User } from '../../domain/user.entity';
import { Email } from '../../domain/email.vo';
import { DuplicateUserEmailError, InvalidEmailError } from '../../domain/identity.errors';

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let mockUserRepo: jest.Mocked<UserRepositoryPort>;
  let mockPasswordHasher: jest.Mocked<PasswordHasherPort>;
  let mockClock: jest.Mocked<ClockPort>;
  let mockIdGenerator: jest.Mocked<IdGeneratorPort>;

  const fixedDate = new Date('2026-10-13T12:00:00.000Z');

  beforeEach(() => {
    mockUserRepo = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAllByClinicId: jest.fn(),
      save: jest.fn(),
    };
    mockPasswordHasher = {
      hash: jest.fn(),
      verify: jest.fn(),
    };
    mockClock = {
      now: jest.fn().mockReturnValue(fixedDate),
      todayInBogota: jest.fn().mockReturnValue('2026-10-13'),
      formatInBogota: jest.fn().mockReturnValue('2026-10-13 07:00:00'),
      isSameDayInBogota: jest.fn().mockReturnValue(true),
    };

    mockIdGenerator = {
      generate: jest.fn().mockReturnValue('user-new-id'),
    };

    useCase = new CreateUserUseCase(mockUserRepo, mockPasswordHasher, mockClock, mockIdGenerator);
  });

  it('debe crear un usuario exitosamente con contraseña hasheada y devolver sus datos sin hash', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockPasswordHasher.hash.mockResolvedValue('$argon2id$hashed-password');

    const command: CreateUserCommand = {
      clinicId: 'clinic-123',
      email: 'auxiliar@consultorio.com',
      password: 'SecurePassword123!',
      fullName: 'Auxiliar Dental',
      role: UserRole.AUXILIARY,
    };

    const result = await useCase.execute(command);

    expect(result).toEqual({
      id: 'user-new-id',
      clinicId: 'clinic-123',
      email: 'auxiliar@consultorio.com',
      fullName: 'Auxiliar Dental',
      role: UserRole.AUXILIARY,
      isActive: true,
      createdAt: fixedDate,
      updatedAt: fixedDate,
    });
    expect(mockPasswordHasher.hash).toHaveBeenCalledWith('SecurePassword123!');
    expect(mockUserRepo.save).toHaveBeenCalledTimes(1);
    const savedUser: User = mockUserRepo.save.mock.calls[0][0];
    expect(savedUser.id).toBe('user-new-id');
    expect(savedUser.passwordHash).toBe('$argon2id$hashed-password');
  });

  it('debe lanzar DuplicateUserEmailError si ya existe un usuario con ese correo', async () => {
    const existingUser = User.create({
      id: 'user-existing',
      clinicId: 'clinic-other',
      email: Email.create('duplicado@consultorio.com'),
      passwordHash: 'hash',
      fullName: 'Existente',
      role: UserRole.AUXILIARY,
      isActive: true,
      createdAt: fixedDate,
      updatedAt: fixedDate,
    });
    mockUserRepo.findByEmail.mockResolvedValue(existingUser);

    const command: CreateUserCommand = {
      clinicId: 'clinic-123',
      email: 'duplicado@consultorio.com',
      password: 'password',
      fullName: 'Nuevo Usuario',
      role: UserRole.AUXILIARY,
    };

    await expect(useCase.execute(command)).rejects.toThrow(DuplicateUserEmailError);
    expect(mockUserRepo.save).not.toHaveBeenCalled();
  });

  it('debe lanzar InvalidEmailError si el correo no tiene formato válido', async () => {
    const command: CreateUserCommand = {
      clinicId: 'clinic-123',
      email: 'correo-invalido',
      password: 'password',
      fullName: 'Nuevo Usuario',
      role: UserRole.AUXILIARY,
    };

    await expect(useCase.execute(command)).rejects.toThrow(InvalidEmailError);
    expect(mockUserRepo.save).not.toHaveBeenCalled();
  });
});
