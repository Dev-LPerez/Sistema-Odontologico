import { GetAuthenticatedUserQuery } from './get-authenticated-user.query';
import { User } from '../../domain/user.entity';
import { Clinic } from '../../domain/clinic.entity';
import { Email } from '../../domain/email.vo';
import { UserRole } from '../../domain/role.enum';
import {
  UserNotFoundError,
  ClinicNotFoundError,
  UserInactiveError,
} from '../../domain/identity.errors';
import { UserRepositoryPort } from '../../domain/user.repository.port';
import { ClinicRepositoryPort } from '../../domain/clinic.repository.port';

describe('GetAuthenticatedUserQuery', () => {
  let queryHandler: GetAuthenticatedUserQuery;
  let mockUserRepo: jest.Mocked<UserRepositoryPort>;
  let mockClinicRepo: jest.Mocked<ClinicRepositoryPort>;

  const now = new Date('2026-10-13T10:00:00.000Z');
  const validClinic = Clinic.create({
    id: 'clinic-123',
    name: 'Consultorio Dra. Angelee Pacheco',
    createdAt: now,
    updatedAt: now,
  });

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

  beforeEach(() => {
    mockUserRepo = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
    };
    mockClinicRepo = {
      findById: jest.fn(),
      save: jest.fn(),
    };

    queryHandler = new GetAuthenticatedUserQuery(mockUserRepo, mockClinicRepo);
  });

  it('debe devolver el perfil completo del usuario y los datos de su consultorio', async () => {
    mockUserRepo.findById.mockResolvedValueOnce(validUser);
    mockClinicRepo.findById.mockResolvedValueOnce(validClinic);

    const result = await queryHandler.execute({
      clinicId: 'clinic-123',
      userId: 'user-001',
    });

    expect(result).toEqual({
      id: 'user-001',
      clinicId: 'clinic-123',
      email: 'dra.angelee@consultorio.com',
      fullName: 'Dra. Angelee Pacheco',
      role: UserRole.ADMIN,
      isActive: true,
      clinic: {
        id: 'clinic-123',
        name: 'Consultorio Dra. Angelee Pacheco',
      },
    });
  });

  it('debe lanzar UserNotFoundError si el usuario no existe', async () => {
    mockUserRepo.findById.mockResolvedValueOnce(null);

    await expect(
      queryHandler.execute({
        clinicId: 'clinic-123',
        userId: 'no-existe',
      }),
    ).rejects.toThrow(UserNotFoundError);
  });

  it('debe lanzar UserInactiveError si el usuario está inactivo', async () => {
    const inactiveUser = User.create({
      id: 'user-002',
      clinicId: 'clinic-123',
      email: Email.create('inactivo@consultorio.com'),
      passwordHash: 'hash',
      fullName: 'Auxiliar Inactivo',
      role: UserRole.AUXILIARY,
      isActive: false,
      createdAt: now,
      updatedAt: now,
    });

    mockUserRepo.findById.mockResolvedValueOnce(inactiveUser);

    await expect(
      queryHandler.execute({
        clinicId: 'clinic-123',
        userId: 'user-002',
      }),
    ).rejects.toThrow(UserInactiveError);
  });

  it('debe lanzar ClinicNotFoundError si la clínica no existe', async () => {
    mockUserRepo.findById.mockResolvedValueOnce(validUser);
    mockClinicRepo.findById.mockResolvedValueOnce(null);

    await expect(
      queryHandler.execute({
        clinicId: 'clinic-inexistente',
        userId: 'user-001',
      }),
    ).rejects.toThrow(ClinicNotFoundError);
  });
});
