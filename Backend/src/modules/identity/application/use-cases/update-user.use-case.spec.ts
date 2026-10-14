import { UpdateUserUseCase, UpdateUserCommand } from './update-user.use-case';
import { UserRepositoryPort } from '../../domain/user.repository.port';
import { PasswordHasherPort } from '../ports/password-hasher.port';
import { ClockPort } from '../../../../shared/application/ports/clock.port';
import { UserRole } from '../../domain/role.enum';
import { User } from '../../domain/user.entity';
import { Email } from '../../domain/email.vo';
import {
  UserNotFoundError,
  DuplicateUserEmailError,
  InvalidEmailError,
} from '../../domain/identity.errors';

describe('UpdateUserUseCase', () => {
  let useCase: UpdateUserUseCase;
  let mockUserRepo: jest.Mocked<UserRepositoryPort>;
  let mockPasswordHasher: jest.Mocked<PasswordHasherPort>;
  let mockClock: jest.Mocked<ClockPort>;

  const initialDate = new Date('2026-10-13T10:00:00.000Z');
  const updateDate = new Date('2026-10-13T12:00:00.000Z');

  const createTargetUser = (): User =>
    User.create({
      id: 'user-001',
      clinicId: 'clinic-123',
      email: Email.create('original@consultorio.com'),
      passwordHash: 'original-hash',
      fullName: 'Nombre Original',
      role: UserRole.AUXILIARY,
      isActive: true,
      createdAt: initialDate,
      updatedAt: initialDate,
    });

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
      now: jest.fn().mockReturnValue(updateDate),
      todayInBogota: jest.fn().mockReturnValue('2026-10-13'),
      formatInBogota: jest.fn().mockReturnValue('2026-10-13 07:00:00'),
      isSameDayInBogota: jest.fn().mockReturnValue(true),
    };

    useCase = new UpdateUserUseCase(mockUserRepo, mockPasswordHasher, mockClock);
  });

  it('debe actualizar los datos de perfil y la contraseña exitosamente', async () => {
    const user = createTargetUser();
    mockUserRepo.findById.mockResolvedValue(user);
    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockPasswordHasher.hash.mockResolvedValue('new-hashed-password');

    const command: UpdateUserCommand = {
      clinicId: 'clinic-123',
      userId: 'user-001',
      fullName: 'Nuevo Nombre',
      email: 'nuevo@consultorio.com',
      role: UserRole.ADMIN,
      password: 'NewSecurePassword123!',
    };

    const result = await useCase.execute(command);

    expect(result).toEqual({
      id: 'user-001',
      clinicId: 'clinic-123',
      email: 'nuevo@consultorio.com',
      fullName: 'Nuevo Nombre',
      role: UserRole.ADMIN,
      isActive: true,
      createdAt: initialDate,
      updatedAt: updateDate,
    });
    expect(mockPasswordHasher.hash).toHaveBeenCalledWith('NewSecurePassword123!');
    expect(user.passwordHash).toBe('new-hashed-password');
    expect(mockUserRepo.save).toHaveBeenCalledWith(user);
  });

  it('debe permitir actualizar solo el nombre sin cambiar correo ni contraseña', async () => {
    const user = createTargetUser();
    mockUserRepo.findById.mockResolvedValue(user);

    const command: UpdateUserCommand = {
      clinicId: 'clinic-123',
      userId: 'user-001',
      fullName: 'Solo Nombre Modificado',
    };

    const result = await useCase.execute(command);

    expect(result.fullName).toBe('Solo Nombre Modificado');
    expect(result.email).toBe('original@consultorio.com');
    expect(mockPasswordHasher.hash).not.toHaveBeenCalled();
    expect(mockUserRepo.findByEmail).not.toHaveBeenCalled();
    expect(mockUserRepo.save).toHaveBeenCalledWith(user);
  });

  it('debe lanzar UserNotFoundError si el usuario no existe en el consultorio', async () => {
    mockUserRepo.findById.mockResolvedValue(null);

    const command: UpdateUserCommand = {
      clinicId: 'clinic-123',
      userId: 'user-nonexistent',
      fullName: 'Cualquiera',
    };

    await expect(useCase.execute(command)).rejects.toThrow(UserNotFoundError);
  });

  it('debe lanzar DuplicateUserEmailError si el nuevo correo pertenece a otro usuario', async () => {
    const user = createTargetUser();
    const otherUser = User.create({
      id: 'user-other',
      clinicId: 'clinic-123',
      email: Email.create('ocupado@consultorio.com'),
      passwordHash: 'hash',
      fullName: 'Otro',
      role: UserRole.AUXILIARY,
      isActive: true,
      createdAt: initialDate,
      updatedAt: initialDate,
    });

    mockUserRepo.findById.mockResolvedValue(user);
    mockUserRepo.findByEmail.mockResolvedValue(otherUser);

    const command: UpdateUserCommand = {
      clinicId: 'clinic-123',
      userId: 'user-001',
      email: 'ocupado@consultorio.com',
    };

    await expect(useCase.execute(command)).rejects.toThrow(DuplicateUserEmailError);
    expect(mockUserRepo.save).not.toHaveBeenCalled();
  });

  it('no debe lanzar DuplicateUserEmailError si el correo no cambia', async () => {
    const user = createTargetUser();
    mockUserRepo.findById.mockResolvedValue(user);

    const command: UpdateUserCommand = {
      clinicId: 'clinic-123',
      userId: 'user-001',
      email: 'original@consultorio.com',
      fullName: 'Nombre Actualizado',
    };

    const result = await useCase.execute(command);
    expect(result.fullName).toBe('Nombre Actualizado');
    expect(mockUserRepo.findByEmail).not.toHaveBeenCalled();
  });

  it('debe lanzar InvalidEmailError si el nuevo correo tiene formato inválido', async () => {
    const user = createTargetUser();
    mockUserRepo.findById.mockResolvedValue(user);

    const command: UpdateUserCommand = {
      clinicId: 'clinic-123',
      userId: 'user-001',
      email: 'correo-sin-formato',
    };

    await expect(useCase.execute(command)).rejects.toThrow(InvalidEmailError);
    expect(mockUserRepo.save).not.toHaveBeenCalled();
  });
});
