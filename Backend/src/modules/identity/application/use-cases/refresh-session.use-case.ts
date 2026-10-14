import { Injectable, Inject } from '@nestjs/common';
import { InvalidRefreshTokenError } from '../../domain/identity.errors';
import { RefreshSession } from '../../domain/refresh-session.entity';
import { AuthenticatedUserDto } from './login.use-case';
import { UserRepositoryPort, USER_REPOSITORY_PORT } from '../../domain/user.repository.port';
import {
  RefreshSessionRepositoryPort,
  REFRESH_SESSION_REPOSITORY_PORT,
} from '../../domain/refresh-session.repository.port';
import { TokenServicePort, TOKEN_SERVICE_PORT } from '../ports/token-service.port';
import { ClockPort, CLOCK_PORT } from '../../../../shared/application/ports/clock.port';
import {
  IdGeneratorPort,
  ID_GENERATOR_PORT,
} from '../../../../shared/application/ports/id-generator.port';

export interface RefreshSessionCommand {
  refreshToken: string;
}

export interface RefreshSessionResult {
  user: AuthenticatedUserDto;
  accessToken: string;
  newRefreshToken: string;
}

@Injectable()
export class RefreshSessionUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepo: UserRepositoryPort,
    @Inject(REFRESH_SESSION_REPOSITORY_PORT)
    private readonly refreshSessionRepo: RefreshSessionRepositoryPort,
    @Inject(TOKEN_SERVICE_PORT)
    private readonly tokenService: TokenServicePort,
    @Inject(CLOCK_PORT)
    private readonly clock: ClockPort,
    @Inject(ID_GENERATOR_PORT)
    private readonly idGenerator: IdGeneratorPort,
  ) {}

  async execute(command: RefreshSessionCommand): Promise<RefreshSessionResult> {
    if (!command.refreshToken) {
      throw new InvalidRefreshTokenError();
    }

    const tokenHash = this.tokenService.hashRefreshToken(command.refreshToken);
    const session = await this.refreshSessionRepo.findByTokenHash(tokenHash);

    const now = this.clock.now();
    if (!session || !session.isValid(now)) {
      throw new InvalidRefreshTokenError();
    }

    const user = await this.userRepo.findById(session.clinicId, session.userId);
    if (!user || !user.isActive) {
      throw new InvalidRefreshTokenError();
    }

    // Rotación: se revoca la sesión anterior
    session.revoke(now);
    await this.refreshSessionRepo.save(session);

    // Se emite un nuevo refresh token y se guarda la nueva sesión
    const newRefreshData = this.tokenService.generateRefreshToken();
    const newSession = RefreshSession.create({
      id: this.idGenerator.generate(),
      clinicId: user.clinicId,
      userId: user.id,
      tokenHash: newRefreshData.tokenHash,
      expiresAt: newRefreshData.expiresAt,
      createdAt: now,
    });
    await this.refreshSessionRepo.save(newSession);

    // Se firma un nuevo accessToken
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
      newRefreshToken: newRefreshData.token,
    };
  }
}
