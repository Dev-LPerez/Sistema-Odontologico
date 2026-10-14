import { Injectable, Inject } from '@nestjs/common';
import { UserRole } from '../../domain/role.enum';
import { CannotDeactivateSelfError, UserNotFoundError } from '../../domain/identity.errors';
import { UserRepositoryPort, USER_REPOSITORY_PORT } from '../../domain/user.repository.port';
import {
  RefreshSessionRepositoryPort,
  REFRESH_SESSION_REPOSITORY_PORT,
} from '../../domain/refresh-session.repository.port';
import {
  UnitOfWorkPort,
  UNIT_OF_WORK_PORT,
} from '../../../../shared/application/ports/unit-of-work.port';
import { ClockPort, CLOCK_PORT } from '../../../../shared/application/ports/clock.port';

export interface ChangeUserStatusCommand {
  clinicId: string;
  targetUserId: string;
  actorUserId: string;
  isActive: boolean;
}

export interface ChangeUserStatusResult {
  id: string;
  clinicId: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ChangeUserStatusUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepo: UserRepositoryPort,
    @Inject(REFRESH_SESSION_REPOSITORY_PORT)
    private readonly refreshSessionRepo: RefreshSessionRepositoryPort,
    @Inject(UNIT_OF_WORK_PORT)
    private readonly unitOfWork: UnitOfWorkPort,
    @Inject(CLOCK_PORT)
    private readonly clock: ClockPort,
  ) {}

  async execute(command: ChangeUserStatusCommand): Promise<ChangeUserStatusResult> {
    if (!command.isActive && command.actorUserId === command.targetUserId) {
      throw new CannotDeactivateSelfError();
    }

    const user = await this.userRepo.findById(command.clinicId, command.targetUserId);
    if (!user) {
      throw new UserNotFoundError(command.targetUserId);
    }

    const now = this.clock.now();

    await this.unitOfWork.execute(async () => {
      user.changeStatus(command.isActive, now);
      await this.userRepo.save(user);

      if (!command.isActive) {
        await this.refreshSessionRepo.revokeAllForUser(user.id, now);
      }
    });

    return {
      id: user.id,
      clinicId: user.clinicId,
      email: user.email.value,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
