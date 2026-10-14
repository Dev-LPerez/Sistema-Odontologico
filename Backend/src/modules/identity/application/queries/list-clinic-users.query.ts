import { Injectable, Inject } from '@nestjs/common';
import { UserRole } from '../../domain/role.enum';
import { UserRepositoryPort, USER_REPOSITORY_PORT } from '../../domain/user.repository.port';

export interface ListClinicUsersQueryRequest {
  clinicId: string;
}

export interface ClinicUserItemDto {
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
export class ListClinicUsersQuery {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepo: UserRepositoryPort,
  ) {}

  async execute(request: ListClinicUsersQueryRequest): Promise<ClinicUserItemDto[]> {
    const users = await this.userRepo.findAllByClinicId(request.clinicId);

    return users.map((user) => ({
      id: user.id,
      clinicId: user.clinicId,
      email: user.email.value,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
  }
}
