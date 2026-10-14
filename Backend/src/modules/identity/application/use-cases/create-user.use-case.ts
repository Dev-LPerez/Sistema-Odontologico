import { Injectable, Inject } from '@nestjs/common';
import { Email } from '../../domain/email.vo';
import { UserRole } from '../../domain/role.enum';
import { User } from '../../domain/user.entity';
import { DuplicateUserEmailError } from '../../domain/identity.errors';
import { UserRepositoryPort, USER_REPOSITORY_PORT } from '../../domain/user.repository.port';
import { PasswordHasherPort, PASSWORD_HASHER_PORT } from '../ports/password-hasher.port';
import { ClockPort, CLOCK_PORT } from '../../../../shared/application/ports/clock.port';
import {
  IdGeneratorPort,
  ID_GENERATOR_PORT,
} from '../../../../shared/application/ports/id-generator.port';

export interface CreateUserCommand {
  clinicId: string;
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
}

export interface CreateUserResult {
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
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepo: UserRepositoryPort,
    @Inject(PASSWORD_HASHER_PORT)
    private readonly passwordHasher: PasswordHasherPort,
    @Inject(CLOCK_PORT)
    private readonly clock: ClockPort,
    @Inject(ID_GENERATOR_PORT)
    private readonly idGenerator: IdGeneratorPort,
  ) {}

  async execute(command: CreateUserCommand): Promise<CreateUserResult> {
    const email = Email.create(command.email);

    const existingUser = await this.userRepo.findByEmail(email);
    if (existingUser) {
      throw new DuplicateUserEmailError(command.email);
    }

    const passwordHash = await this.passwordHasher.hash(command.password);
    const id = this.idGenerator.generate();
    const now = this.clock.now();

    const user = User.create({
      id,
      clinicId: command.clinicId,
      email,
      passwordHash,
      fullName: command.fullName.trim(),
      role: command.role,
      isActive: true,
      createdAt: now,
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
