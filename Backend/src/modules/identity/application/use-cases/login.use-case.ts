import { Injectable, Inject } from '@nestjs/common';
import { Email } from '../../domain/email.vo';
import { UserRole } from '../../domain/role.enum';
import { InvalidCredentialsError } from '../../domain/identity.errors';
import { RefreshSession } from '../../domain/refresh-session.entity';
import { UserRepositoryPort, USER_REPOSITORY_PORT } from '../../domain/user.repository.port';
import {
  RefreshSessionRepositoryPort,
  REFRESH_SESSION_REPOSITORY_PORT,
} from '../../domain/refresh-session.repository.port';
import { PasswordHasherPort, PASSWORD_HASHER_PORT } from '../ports/password-hasher.port';
import { TokenServicePort, TOKEN_SERVICE_PORT } from '../ports/token-service.port';
import { ClockPort, CLOCK_PORT } from '../../../../shared/application/ports/clock.port';
import {
  IdGeneratorPort,
  ID_GENERATOR_PORT,
} from '../../../../shared/application/ports/id-generator.port';

export interface LoginCommand {
  email: string;
  password: string;
}

export interface AuthenticatedUserDto {
  id: string;
  clinicId: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export interface LoginResult {
  user: AuthenticatedUserDto;
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepo: UserRepositoryPort,
    @Inject(REFRESH_SESSION_REPOSITORY_PORT)
    private readonly refreshSessionRepo: RefreshSessionRepositoryPort,
    @Inject(PASSWORD_HASHER_PORT)
    private readonly passwordHasher: PasswordHasherPort,
    @Inject(TOKEN_SERVICE_PORT)
    private readonly tokenService: TokenServicePort,
    @Inject(CLOCK_PORT)
    private readonly clock: ClockPort,
    @Inject(ID_GENERATOR_PORT)
    private readonly idGenerator: IdGeneratorPort,
  ) {}

  async execute(command: LoginCommand): Promise<LoginResult> {
    const email = Email.create(command.email);
    const user = await this.userRepo.findByEmail(email);

    if (!user) {
      throw new InvalidCredentialsError();
    }

    user.ensureIsActive();

    const isPasswordValid = await this.passwordHasher.verify(command.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    const refreshTokenData = this.tokenService.generateRefreshToken();

    const session = RefreshSession.create({
      id: this.idGenerator.generate(),
      clinicId: user.clinicId,
      userId: user.id,
      tokenHash: refreshTokenData.tokenHash,
      expiresAt: refreshTokenData.expiresAt,
      createdAt: this.clock.now(),
    });

    await this.refreshSessionRepo.save(session);

    const accessToken = await this.tokenService.signAccessToken({
      sub: user.id,
      clinicId: user.clinicId,
      email: user.email.value,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        clinicId: user.clinicId,
        email: user.email.value,
        fullName: user.fullName,
        role: user.role,
      },
      accessToken,
      refreshToken: refreshTokenData.token,
    };
  }
}
