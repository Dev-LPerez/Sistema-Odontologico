import { ListClinicUsersQuery, ListClinicUsersQueryRequest } from './list-clinic-users.query';
import { UserRepositoryPort } from '../../domain/user.repository.port';
import { UserRole } from '../../domain/role.enum';
import { User } from '../../domain/user.entity';
import { Email } from '../../domain/email.vo';

describe('ListClinicUsersQuery', () => {
  let query: ListClinicUsersQuery;
  let mockUserRepo: jest.Mocked<UserRepositoryPort>;

  const date = new Date('2026-10-13T10:00:00.000Z');

  beforeEach(() => {
    mockUserRepo = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAllByClinicId: jest.fn(),
      save: jest.fn(),
    };

    query = new ListClinicUsersQuery(mockUserRepo);
  });

  it('debe retornar la lista de usuarios del consultorio sin exponer passwordHash', async () => {
    const user1 = User.create({
      id: 'user-001',
      clinicId: 'clinic-123',
      email: Email.create('doctora@consultorio.com'),
      passwordHash: 'secret-hash-1',
      fullName: 'Dra. Angelee Pacheco',
      role: UserRole.ADMIN,
      isActive: true,
      createdAt: date,
      updatedAt: date,
    });
    const user2 = User.create({
      id: 'user-002',
      clinicId: 'clinic-123',
      email: Email.create('auxiliar@consultorio.com'),
      passwordHash: 'secret-hash-2',
      fullName: 'Auxiliar Dental',
      role: UserRole.AUXILIARY,
      isActive: false,
      createdAt: date,
      updatedAt: date,
    });

    mockUserRepo.findAllByClinicId.mockResolvedValue([user1, user2]);

    const request: ListClinicUsersQueryRequest = {
      clinicId: 'clinic-123',
    };

    const result = await query.execute(request);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: 'user-001',
      clinicId: 'clinic-123',
      email: 'doctora@consultorio.com',
      fullName: 'Dra. Angelee Pacheco',
      role: UserRole.ADMIN,
      isActive: true,
      createdAt: date,
      updatedAt: date,
    });
    expect(result[1]).toEqual({
      id: 'user-002',
      clinicId: 'clinic-123',
      email: 'auxiliar@consultorio.com',
      fullName: 'Auxiliar Dental',
      role: UserRole.AUXILIARY,
      isActive: false,
      createdAt: date,
      updatedAt: date,
    });
    expect((result[0] as unknown as Record<string, unknown>).passwordHash).toBeUndefined();
    expect((result[1] as unknown as Record<string, unknown>).passwordHash).toBeUndefined();
    expect(mockUserRepo.findAllByClinicId).toHaveBeenCalledWith('clinic-123');
  });

  it('debe retornar arreglo vacío si el consultorio no tiene usuarios registrados', async () => {
    mockUserRepo.findAllByClinicId.mockResolvedValue([]);

    const result = await query.execute({ clinicId: 'clinic-empty' });

    expect(result).toEqual([]);
    expect(mockUserRepo.findAllByClinicId).toHaveBeenCalledWith('clinic-empty');
  });
});
