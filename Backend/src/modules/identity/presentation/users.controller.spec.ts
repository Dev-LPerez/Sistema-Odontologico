import { UsersController } from './users.controller';
import { CreateUserUseCase } from '../application/use-cases/create-user.use-case';
import { UpdateUserUseCase } from '../application/use-cases/update-user.use-case';
import { ChangeUserStatusUseCase } from '../application/use-cases/change-user-status.use-case';
import { ListClinicUsersQuery } from '../application/queries/list-clinic-users.query';
import { UserRole } from '../domain/role.enum';
import { AuthenticatedUserPayload } from '../../../shared/presentation/decorators';

describe('UsersController', () => {
  let controller: UsersController;
  let mockCreateUserUseCase: jest.Mocked<CreateUserUseCase>;
  let mockUpdateUserUseCase: jest.Mocked<UpdateUserUseCase>;
  let mockChangeUserStatusUseCase: jest.Mocked<ChangeUserStatusUseCase>;
  let mockListClinicUsersQuery: jest.Mocked<ListClinicUsersQuery>;

  const fixedDate = new Date('2026-10-13T10:00:00.000Z');

  beforeEach(() => {
    mockCreateUserUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CreateUserUseCase>;

    mockUpdateUserUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<UpdateUserUseCase>;

    mockChangeUserStatusUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<ChangeUserStatusUseCase>;

    mockListClinicUsersQuery = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<ListClinicUsersQuery>;

    controller = new UsersController(
      mockCreateUserUseCase,
      mockUpdateUserUseCase,
      mockChangeUserStatusUseCase,
      mockListClinicUsersQuery,
    );
  });

  describe('listUsers', () => {
    it('debe invocar ListClinicUsersQuery con el clinicId autenticado', async () => {
      const mockResult = [
        {
          id: 'user-1',
          clinicId: 'clinic-123',
          email: 'dra@clinica.com',
          fullName: 'Dra. Angelee',
          role: UserRole.ADMIN,
          isActive: true,
          createdAt: fixedDate,
          updatedAt: fixedDate,
        },
      ];
      mockListClinicUsersQuery.execute.mockResolvedValue(mockResult);

      const result = await controller.listUsers('clinic-123');

      expect(mockListClinicUsersQuery.execute).toHaveBeenCalledWith({ clinicId: 'clinic-123' });
      expect(result).toBe(mockResult);
    });
  });

  describe('createUser', () => {
    it('debe invocar CreateUserUseCase con el payload y clinicId', async () => {
      const dto = {
        email: 'aux@clinica.com',
        password: 'Password123!',
        fullName: 'Auxiliar Dental',
        role: UserRole.AUXILIARY,
      };
      const mockCreated = {
        id: 'new-user',
        clinicId: 'clinic-123',
        email: 'aux@clinica.com',
        fullName: 'Auxiliar Dental',
        role: UserRole.AUXILIARY,
        isActive: true,
        createdAt: fixedDate,
        updatedAt: fixedDate,
      };
      mockCreateUserUseCase.execute.mockResolvedValue(mockCreated);

      const result = await controller.createUser('clinic-123', dto);

      expect(mockCreateUserUseCase.execute).toHaveBeenCalledWith({
        clinicId: 'clinic-123',
        ...dto,
      });
      expect(result).toBe(mockCreated);
    });
  });

  describe('updateUser', () => {
    it('debe invocar UpdateUserUseCase con el userId, clinicId y campos actualizados', async () => {
      const dto = {
        fullName: 'Nombre Actualizado',
        role: UserRole.ADMIN,
      };
      const mockUpdated = {
        id: 'user-1',
        clinicId: 'clinic-123',
        email: 'dra@clinica.com',
        fullName: 'Nombre Actualizado',
        role: UserRole.ADMIN,
        isActive: true,
        createdAt: fixedDate,
        updatedAt: fixedDate,
      };
      mockUpdateUserUseCase.execute.mockResolvedValue(mockUpdated);

      const result = await controller.updateUser('clinic-123', 'user-1', dto);

      expect(mockUpdateUserUseCase.execute).toHaveBeenCalledWith({
        clinicId: 'clinic-123',
        userId: 'user-1',
        ...dto,
      });
      expect(result).toBe(mockUpdated);
    });
  });

  describe('changeStatus', () => {
    it('debe invocar ChangeUserStatusUseCase con actorUserId y targetUserId', async () => {
      const actor: AuthenticatedUserPayload = {
        sub: 'actor-admin-id',
        clinicId: 'clinic-123',
        email: 'admin@clinica.com',
        role: 'ADMIN',
      };
      const dto = { isActive: false };
      const mockResult = {
        id: 'target-user',
        clinicId: 'clinic-123',
        email: 'target@clinica.com',
        fullName: 'Usuario Desactivado',
        role: UserRole.AUXILIARY,
        isActive: false,
        createdAt: fixedDate,
        updatedAt: fixedDate,
      };
      mockChangeUserStatusUseCase.execute.mockResolvedValue(mockResult);

      const result = await controller.changeStatus('clinic-123', actor, 'target-user', dto);

      expect(mockChangeUserStatusUseCase.execute).toHaveBeenCalledWith({
        clinicId: 'clinic-123',
        targetUserId: 'target-user',
        actorUserId: 'actor-admin-id',
        isActive: false,
      });
      expect(result).toBe(mockResult);
    });
  });
});
