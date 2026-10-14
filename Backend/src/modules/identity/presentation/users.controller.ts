import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '../../../shared/presentation/guards';
import {
  AuthenticatedUserPayload,
  CurrentClinic,
  CurrentUser,
  Roles,
} from '../../../shared/presentation/decorators';
import { CreateUserUseCase } from '../application/use-cases/create-user.use-case';
import { UpdateUserUseCase } from '../application/use-cases/update-user.use-case';
import { ChangeUserStatusUseCase } from '../application/use-cases/change-user-status.use-case';
import { ListClinicUsersQuery } from '../application/queries/list-clinic-users.query';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangeUserStatusDto } from './dto/change-user-status.dto';
import { UserResponseDto } from './dto/clinic-profile.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('users')
export class UsersController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly changeUserStatusUseCase: ChangeUserStatusUseCase,
    private readonly listClinicUsersQuery: ListClinicUsersQuery,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los usuarios del consultorio' })
  @ApiOkResponse({
    description: 'Lista de usuarios pertenecientes al consultorio',
    type: [UserResponseDto],
  })
  @ApiUnauthorizedResponse({ description: 'No autenticado' })
  @ApiForbiddenResponse({ description: 'Requiere rol ADMIN' })
  async listUsers(@CurrentClinic() clinicId: string): Promise<UserResponseDto[]> {
    return this.listClinicUsersQuery.execute({ clinicId });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo usuario para el consultorio' })
  @ApiCreatedResponse({
    description: 'Usuario creado exitosamente',
    type: UserResponseDto,
  })
  @ApiConflictResponse({ description: 'El correo electrónico ya se encuentra registrado' })
  @ApiUnauthorizedResponse({ description: 'No autenticado' })
  @ApiForbiddenResponse({ description: 'Requiere rol ADMIN' })
  async createUser(
    @CurrentClinic() clinicId: string,
    @Body() dto: CreateUserDto,
  ): Promise<UserResponseDto> {
    return this.createUserUseCase.execute({
      clinicId,
      email: dto.email,
      password: dto.password,
      fullName: dto.fullName,
      role: dto.role,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar perfil de un usuario del consultorio' })
  @ApiOkResponse({
    description: 'Usuario actualizado exitosamente',
    type: UserResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  @ApiConflictResponse({
    description: 'El nuevo correo ya se encuentra registrado por otro usuario',
  })
  @ApiUnauthorizedResponse({ description: 'No autenticado' })
  @ApiForbiddenResponse({ description: 'Requiere rol ADMIN' })
  async updateUser(
    @CurrentClinic() clinicId: string,
    @Param('id') userId: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.updateUserUseCase.execute({
      clinicId,
      userId,
      fullName: dto.fullName,
      email: dto.email,
      role: dto.role,
      password: dto.password,
    });
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Activar o desactivar cuenta de usuario y revocar sesiones activas si se desactiva',
  })
  @ApiOkResponse({
    description: 'Estado del usuario actualizado exitosamente',
    type: UserResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  @ApiUnprocessableEntityResponse({
    description: 'Un usuario no puede desactivar su propia cuenta',
  })
  @ApiUnauthorizedResponse({ description: 'No autenticado' })
  @ApiForbiddenResponse({ description: 'Requiere rol ADMIN' })
  async changeStatus(
    @CurrentClinic() clinicId: string,
    @CurrentUser() actor: AuthenticatedUserPayload,
    @Param('id') userId: string,
    @Body() dto: ChangeUserStatusDto,
  ): Promise<UserResponseDto> {
    return this.changeUserStatusUseCase.execute({
      clinicId,
      targetUserId: userId,
      actorUserId: actor.sub,
      isActive: dto.isActive,
    });
  }
}
