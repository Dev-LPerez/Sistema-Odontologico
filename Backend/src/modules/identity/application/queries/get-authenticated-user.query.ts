import { Injectable, Inject } from '@nestjs/common';
import { UserRole } from '../../domain/role.enum';
import { UserNotFoundError, ClinicNotFoundError } from '../../domain/identity.errors';
import { UserRepositoryPort, USER_REPOSITORY_PORT } from '../../domain/user.repository.port';
import { ClinicRepositoryPort, CLINIC_REPOSITORY_PORT } from '../../domain/clinic.repository.port';

export interface GetAuthenticatedUserQueryRequest {
  clinicId: string;
  userId: string;
}

export interface UserProfileDto {
  id: string;
  clinicId: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  clinic: {
    id: string;
    name: string;
  };
}

@Injectable()
export class GetAuthenticatedUserQuery {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepo: UserRepositoryPort,
    @Inject(CLINIC_REPOSITORY_PORT)
    private readonly clinicRepo: ClinicRepositoryPort,
  ) {}

  async execute(request: GetAuthenticatedUserQueryRequest): Promise<UserProfileDto> {
    const user = await this.userRepo.findById(request.clinicId, request.userId);

    if (!user) {
      throw new UserNotFoundError(request.userId);
    }

    user.ensureIsActive();

    const clinic = await this.clinicRepo.findById(request.clinicId);
    if (!clinic) {
      throw new ClinicNotFoundError(request.clinicId);
    }

    return {
      id: user.id,
      clinicId: user.clinicId,
      email: user.email.value,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
      clinic: {
        id: clinic.id,
        name: clinic.name,
      },
    };
  }
}
