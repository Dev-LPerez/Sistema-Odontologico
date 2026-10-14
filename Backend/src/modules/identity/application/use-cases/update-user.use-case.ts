import { Injectable, Inject } from '@nestjs/common';
import { Email } from '../../domain/email.vo';
import { UserRole } from '../../domain/role.enum';
import { UserNotFoundError, DuplicateUserEmailError } from '../../domain/identity.errors';
import { UserRepositoryPort, USER_REPOSITORY_PORT } from '../../domain/user.repository.port';
import { PasswordHasherPort, PASSWORD_HASHER_PORT } from '../ports/password-hasher.port';
import { ClockPort, CLOCK_PORT } from '../../../../shared/application/ports/clock.port';

export interface UpdateUserCommand {
  clinicId: string;
  userId: string;
  fullName?: string;
  email?: string;
  role?: UserRole;
  password?: string;
}

export interface UpdateUserResult {
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
export class UpdateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepo: UserRepositoryPort,
    @Inject(PASSWORD_HASHER_PORT)
    private readonly passwordHasher: PasswordHasherPort,
    @Inject(CLOCK_PORT)
    private readonly clock: ClockPort,
  ) {}

  async execute(command: UpdateUserCommand): Promise<UpdateUserResult> {
    const user = await this.userRepo.findById(command.clinicId, command.userId);
    if (!user) {
      throw new UserNotFoundError(command.userId);
    }

    let parsedEmail: Email | undefined;
    if (command.email !== undefined) {
      parsedEmail = Email.create(command.email);
      if (!parsedEmail.equals(user.email)) {
        const existing = await this.userRepo.findByEmail(parsedEmail);
        if (existing && existing.id !== user.id) {
          throw new DuplicateUserEmailError(command.email);
        }
      }
    }

    const now = this.clock.now();

    if (command.password !== undefined && command.password.trim().length > 0) {
      const newHash = await this.passwordHasher.hash(command.password);
      user.changePassword(newHash, now);
    }

    user.updateProfile({
      fullName: command.fullName,
      email: parsedEmail,
      role: command.role,
      updatedAt: now,
    });

    await this.userRepo.save(user);

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
