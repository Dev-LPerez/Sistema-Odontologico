import { Injectable, Inject } from '@nestjs/common';
import {
  RefreshSessionRepositoryPort,
  REFRESH_SESSION_REPOSITORY_PORT,
} from '../../domain/refresh-session.repository.port';
import { TokenServicePort, TOKEN_SERVICE_PORT } from '../ports/token-service.port';
import { ClockPort, CLOCK_PORT } from '../../../../shared/application/ports/clock.port';

export interface LogoutCommand {
  refreshToken?: string;
}

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(REFRESH_SESSION_REPOSITORY_PORT)
    private readonly refreshSessionRepo: RefreshSessionRepositoryPort,
    @Inject(TOKEN_SERVICE_PORT)
    private readonly tokenService: TokenServicePort,
    @Inject(CLOCK_PORT)
    private readonly clock: ClockPort,
  ) {}

  async execute(command: LogoutCommand): Promise<void> {
    if (!command.refreshToken) {
      return;
    }

    const tokenHash = this.tokenService.hashRefreshToken(command.refreshToken);
    const session = await this.refreshSessionRepo.findByTokenHash(tokenHash);

    if (session && !session.isRevoked()) {
      session.revoke(this.clock.now());
      await this.refreshSessionRepo.save(session);
    }
  }
}
