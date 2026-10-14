import { ChangeUserStatusUseCase, ChangeUserStatusCommand } from './change-user-status.use-case';
import { UserRepositoryPort } from '../../domain/user.repository.port';
import { RefreshSessionRepositoryPort } from '../../domain/refresh-session.repository.port';
import { UnitOfWorkPort } from '../../../../shared/application/ports/unit-of-work.port';
import { ClockPort } from '../../../../shared/application/ports/clock.port';
import { UserRole } from '../../domain/role.enum';
import { User } from '../../domain/user.entity';
import { Email } from '../../domain/email.vo';
import { CannotDeactivateSelfError, UserNotFoundError } from '../../domain/identity.errors';

describe('ChangeUserStatusUseCase', () => {
  let useCase: ChangeUserStatusUseCase;
  let mockUserRepo: jest.Mocked<UserRepositoryPort>;
  let mockRefreshSessionRepo: jest.Mocked<RefreshSessionRepositoryPort>;
  let mockUnitOfWork: jest.Mocked<UnitOfWorkPort>;
  let mockClock: jest.Mocked<ClockPort>;

  const fixedDate = new Date('2026-10-13T12:00:00.000Z');

  const createTargetUser = (isActive = true): User =>
    User.create({
      id: 'target-user-id',
      clinicId: 'clinic-123',
      email: Email.create('target@consultorio.com'),
      passwordHash: 'hash',
      fullName: 'Usuario Objetivo',
      role: UserRole.AUXILIARY,
      isActive,
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
    mockUnitOfWork = {
      execute: jest.fn().mockImplementation((work: () => Promise<unknown>) => work()),
    };

    mockClock = {
      now: jest.fn().mockReturnValue(fixedDate),
      todayInBogota: jest.fn().mockReturnValue('2026-10-13'),
      formatInBogota: jest.fn().mockReturnValue('2026-10-13 07:00:00'),
      isSameDayInBogota: jest.fn().mockReturnValue(true),
    };

    useCase = new ChangeUserStatusUseCase(
      mockUserRepo,
      mockRefreshSessionRepo,
      mockUnitOfWork,
      mockClock,
    );
  });

  it('debe desactivar un usuario y revocar sus sesiones de refresco dentro de la transacción', async () => {
    const user = createTargetUser(true);
    mockUserRepo.findById.mockResolvedValue(user);

    const command: ChangeUserStatusCommand = {
      clinicId: 'clinic-123',
      actorUserId: 'admin-user-id',
      targetUserId: 'target-user-id',
      isActive: false,
    };

    const result = await useCase.execute(command);

    expect(result.isActive).toBe(false);
    expect(user.isActive).toBe(false);
    expect(mockUnitOfWork.execute).toHaveBeenCalledTimes(1);
    expect(mockUserRepo.save).toHaveBeenCalledWith(user);
    expect(mockRefreshSessionRepo.revokeAllForUser).toHaveBeenCalledWith(
      'target-user-id',
      fixedDate,
    );
  });

  it('debe reactivar un usuario sin revocar sesiones', async () => {
    const user = createTargetUser(false);
    mockUserRepo.findById.mockResolvedValue(user);

    const command: ChangeUserStatusCommand = {
      clinicId: 'clinic-123',
      actorUserId: 'admin-user-id',
      targetUserId: 'target-user-id',
      isActive: true,
    };

    const result = await useCase.execute(command);

    expect(result.isActive).toBe(true);
    expect(user.isActive).toBe(true);
    expect(mockUnitOfWork.execute).toHaveBeenCalledTimes(1);
    expect(mockUserRepo.save).toHaveBeenCalledWith(user);
    expect(mockRefreshSessionRepo.revokeAllForUser).not.toHaveBeenCalled();
  });

  it('debe lanzar CannotDeactivateSelfError si la administradora intenta desactivarse a sí misma', async () => {
    const command: ChangeUserStatusCommand = {
      clinicId: 'clinic-123',
      actorUserId: 'admin-user-id',
      targetUserId: 'admin-user-id',
      isActive: false,
    };

    await expect(useCase.execute(command)).rejects.toThrow(CannotDeactivateSelfError);
    expect(mockUserRepo.findById).not.toHaveBeenCalled();
    expect(mockUnitOfWork.execute).not.toHaveBeenCalled();
  });

  it('debe lanzar UserNotFoundError si el usuario objetivo no existe', async () => {
    mockUserRepo.findById.mockResolvedValue(null);

    const command: ChangeUserStatusCommand = {
      clinicId: 'clinic-123',
      actorUserId: 'admin-user-id',
      targetUserId: 'non-existent-user',
      isActive: false,
    };

    await expect(useCase.execute(command)).rejects.toThrow(UserNotFoundError);
    expect(mockUnitOfWork.execute).not.toHaveBeenCalled();
  });
});
