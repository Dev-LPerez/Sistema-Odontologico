import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { LoginUseCase } from '../application/use-cases/login.use-case';
import { RefreshSessionUseCase } from '../application/use-cases/refresh-session.use-case';
import { LogoutUseCase } from '../application/use-cases/logout.use-case';
import { GetAuthenticatedUserQuery } from '../application/queries/get-authenticated-user.query';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto, RefreshResponseDto, UserProfileDto } from './dto/auth-response.dto';
import {
  AuthenticatedUserPayload,
  CurrentUser,
  Public,
  Roles,
} from '../../../shared/presentation/decorators';
import { JwtAuthGuard, RolesGuard } from '../../../shared/presentation/guards';
import { InvalidRefreshTokenError } from '../domain/identity.errors';

const REFRESH_COOKIE_NAME = 'refresh_token';
const REFRESH_COOKIE_PATH = '/v1/auth';
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 días

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshSessionUseCase: RefreshSessionUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly getAuthenticatedUserQuery: GetAuthenticatedUserQuery,
  ) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión con correo y contraseña' })
  @ApiOkResponse({
    description: 'Sesión iniciada exitosamente',
    type: LoginResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Credenciales inválidas o usuario inactivo' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    const result = await this.loginUseCase.execute({
      email: dto.email,
      password: dto.password,
    });

    this.setRefreshTokenCookie(res, result.refreshToken);

    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar accessToken rotando la sesión de refresco' })
  @ApiOkResponse({
    description: 'Sesión renovada exitosamente',
    type: RefreshResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Token de refresco inválido o expirado' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RefreshResponseDto> {
    const refreshToken = (req.cookies as Record<string, string | undefined>)?.[REFRESH_COOKIE_NAME];

    if (!refreshToken) {
      throw new InvalidRefreshTokenError();
    }

    const result = await this.refreshSessionUseCase.execute({ refreshToken });

    this.setRefreshTokenCookie(res, result.newRefreshToken);

    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cerrar sesión y revocar sesión de refresco' })
  @ApiNoContentResponse({ description: 'Sesión cerrada exitosamente' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    const refreshToken = (req.cookies as Record<string, string | undefined>)?.[REFRESH_COOKIE_NAME];

    await this.logoutUseCase.execute({ refreshToken });

    this.clearRefreshTokenCookie(res);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Obtener datos del usuario autenticado' })
  @ApiOkResponse({
    description: 'Perfil del usuario autenticado',
    type: UserProfileDto,
  })
  async me(@CurrentUser() currentUser: AuthenticatedUserPayload): Promise<UserProfileDto> {
    return this.getAuthenticatedUserQuery.execute({
      clinicId: currentUser.clinicId,
      userId: currentUser.sub,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @Get('admin-only')
  @ApiOperation({ summary: 'Ruta protegida exclusiva para rol ADMIN' })
  @ApiOkResponse({ description: 'Acceso concedido a administradora' })
  adminOnly(): { message: string } {
    return { message: 'Acceso concedido a administradora' };
  }

  private setRefreshTokenCookie(res: Response, refreshToken: string): void {
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: REFRESH_COOKIE_PATH,
      maxAge: REFRESH_COOKIE_MAX_AGE,
    });
  }

  private clearRefreshTokenCookie(res: Response): void {
    const isProduction = process.env.NODE_ENV === 'production';
    res.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: REFRESH_COOKIE_PATH,
    });
  }
}
