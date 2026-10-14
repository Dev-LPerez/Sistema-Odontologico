import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CLINIC_REPOSITORY_PORT } from './domain/clinic.repository.port';
import { USER_REPOSITORY_PORT } from './domain/user.repository.port';
import { REFRESH_SESSION_REPOSITORY_PORT } from './domain/refresh-session.repository.port';
import { PASSWORD_HASHER_PORT } from './application/ports/password-hasher.port';
import { TOKEN_SERVICE_PORT } from './application/ports/token-service.port';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { RefreshSessionUseCase } from './application/use-cases/refresh-session.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case';
import { UpdateUserUseCase } from './application/use-cases/update-user.use-case';
import { ChangeUserStatusUseCase } from './application/use-cases/change-user-status.use-case';
import { UpdateClinicProfileUseCase } from './application/use-cases/update-clinic-profile.use-case';
import { GetAuthenticatedUserQuery } from './application/queries/get-authenticated-user.query';
import { ListClinicUsersQuery } from './application/queries/list-clinic-users.query';
import { GetClinicProfileQuery } from './application/queries/get-clinic-profile.query';
import { Argon2PasswordHasherAdapter } from './infrastructure/adapters/argon2-password-hasher.adapter';
import { JwtTokenServiceAdapter } from './infrastructure/adapters/jwt-token-service.adapter';
import { PrismaClinicRepository } from './infrastructure/repositories/prisma-clinic.repository';
import { PrismaUserRepository } from './infrastructure/repositories/prisma-user.repository';
import { PrismaRefreshSessionRepository } from './infrastructure/repositories/prisma-refresh-session.repository';
import { AuthController } from './presentation/auth.controller';
import { UsersController } from './presentation/users.controller';
import { ClinicController } from './presentation/clinic.controller';
import { JwtAuthGuard, RolesGuard } from '../../shared/presentation/guards';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret-key-identity-auth-1234567890',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController, UsersController, ClinicController],
  providers: [
    // Repositories
    {
      provide: CLINIC_REPOSITORY_PORT,
      useClass: PrismaClinicRepository,
    },
    {
      provide: USER_REPOSITORY_PORT,
      useClass: PrismaUserRepository,
    },
    {
      provide: REFRESH_SESSION_REPOSITORY_PORT,
      useClass: PrismaRefreshSessionRepository,
    },
    // Application Adapters
    {
      provide: PASSWORD_HASHER_PORT,
      useClass: Argon2PasswordHasherAdapter,
    },
    {
      provide: TOKEN_SERVICE_PORT,
      useClass: JwtTokenServiceAdapter,
    },
    // Use Cases and Queries
    LoginUseCase,
    RefreshSessionUseCase,
    LogoutUseCase,
    CreateUserUseCase,
    UpdateUserUseCase,
    ChangeUserStatusUseCase,
    UpdateClinicProfileUseCase,
    GetAuthenticatedUserQuery,
    ListClinicUsersQuery,
    GetClinicProfileQuery,
    // Guards
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [
    JwtModule,
    CLINIC_REPOSITORY_PORT,
    USER_REPOSITORY_PORT,
    REFRESH_SESSION_REPOSITORY_PORT,
    PASSWORD_HASHER_PORT,
    TOKEN_SERVICE_PORT,
    LoginUseCase,
    RefreshSessionUseCase,
    LogoutUseCase,
    CreateUserUseCase,
    UpdateUserUseCase,
    ChangeUserStatusUseCase,
    UpdateClinicProfileUseCase,
    GetAuthenticatedUserQuery,
    ListClinicUsersQuery,
    GetClinicProfileQuery,
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class IdentityModule {}
