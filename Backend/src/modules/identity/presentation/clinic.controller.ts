import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '../../../shared/presentation/guards';
import { CurrentClinic, Roles } from '../../../shared/presentation/decorators';
import { GetClinicProfileQuery } from '../application/queries/get-clinic-profile.query';
import { UpdateClinicProfileUseCase } from '../application/use-cases/update-clinic-profile.use-case';
import { UpdateClinicDto } from './dto/update-clinic.dto';
import { ClinicProfileResponseDto } from './dto/clinic-profile.dto';

@ApiTags('Clinic')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('clinic')
export class ClinicController {
  constructor(
    private readonly getClinicProfileQuery: GetClinicProfileQuery,
    private readonly updateClinicProfileUseCase: UpdateClinicProfileUseCase,
  ) {}

  @Get()
  @Roles('ADMIN', 'AUXILIARY')
  @ApiOperation({ summary: 'Obtener datos y configuración del consultorio autenticado' })
  @ApiOkResponse({
    description: 'Perfil y configuración del consultorio',
    type: ClinicProfileResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'No autenticado' })
  @ApiForbiddenResponse({ description: 'Rol sin permisos' })
  @ApiNotFoundResponse({ description: 'Consultorio no encontrado' })
  async getProfile(@CurrentClinic() clinicId: string): Promise<ClinicProfileResponseDto> {
    return this.getClinicProfileQuery.execute({ clinicId });
  }

  @Patch()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Actualizar perfil y configuración del consultorio autenticado' })
  @ApiOkResponse({
    description: 'Perfil y configuración del consultorio actualizado exitosamente',
    type: ClinicProfileResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Nombre de consultorio inválido o datos incorrectos' })
  @ApiUnauthorizedResponse({ description: 'No autenticado' })
  @ApiForbiddenResponse({ description: 'Requiere rol ADMIN' })
  @ApiNotFoundResponse({ description: 'Consultorio no encontrado' })
  async updateProfile(
    @CurrentClinic() clinicId: string,
    @Body() dto: UpdateClinicDto,
  ): Promise<ClinicProfileResponseDto> {
    return this.updateClinicProfileUseCase.execute({
      clinicId,
      name: dto.name,
      address: dto.address,
      phone: dto.phone,
      email: dto.email,
      logoUrl: dto.logoUrl,
      settings: dto.settings,
    });
  }
}
