import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/presentation/guards/roles.guard';
import {
  CurrentUser,
  AuthenticatedUserPayload,
  Roles,
} from '../../../shared/presentation/decorators';
import { UserRole } from '../../identity';
import { CreatePatientUseCase } from '../application/use-cases/create-patient.use-case';
import { UpdatePatientUseCase } from '../application/use-cases/update-patient.use-case';
import { ChangePatientStatusUseCase } from '../application/use-cases/change-patient-status.use-case';
import { GetPatientByIdQuery } from '../application/queries/get-patient-by-id.query';
import { ListPatientsQuery } from '../application/queries/list-patients.query';
import { DetectDuplicatePatientsQuery } from '../application/queries/detect-duplicate-patients.query';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { ChangePatientStatusDto } from './dto/change-patient-status.dto';
import { CheckDuplicatesQueryDto } from './dto/check-duplicates-query.dto';
import { PatientResponseDto, DuplicatePatientResponseDto } from './dto/patient-response.dto';

@ApiTags('Patients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('patients')
export class PatientsController {
  constructor(
    private readonly createPatientUseCase: CreatePatientUseCase,
    private readonly updatePatientUseCase: UpdatePatientUseCase,
    private readonly changePatientStatusUseCase: ChangePatientStatusUseCase,
    private readonly getPatientByIdQuery: GetPatientByIdQuery,
    private readonly listPatientsQuery: ListPatientsQuery,
    private readonly detectDuplicatePatientsQuery: DetectDuplicatePatientsQuery,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.AUXILIARY)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un nuevo paciente' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Paciente registrado exitosamente',
    type: PatientResponseDto,
  })
  async create(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Body() dto: CreatePatientDto,
  ): Promise<PatientResponseDto> {
    return this.createPatientUseCase.execute({
      clinicId: user.clinicId,
      ...dto,
    });
  }

  @Get('check-duplicates')
  @Roles(UserRole.ADMIN, UserRole.AUXILIARY)
  @ApiOperation({ summary: 'Verificar posibles pacientes duplicados por documento o teléfono' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de posibles duplicados encontrados',
    type: [DuplicatePatientResponseDto],
  })
  async checkDuplicates(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Query() query: CheckDuplicatesQueryDto,
  ): Promise<DuplicatePatientResponseDto[]> {
    return this.detectDuplicatePatientsQuery.execute({
      clinicId: user.clinicId,
      documentNumber: query.documentNumber,
      phone: query.phone,
      excludePatientId: query.excludePatientId,
    });
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.AUXILIARY)
  @ApiOperation({ summary: 'Listar pacientes de la clínica' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Listado de pacientes',
    type: [PatientResponseDto],
  })
  async list(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Query('isActive') isActive?: string,
  ): Promise<PatientResponseDto[]> {
    const filterIsActive = isActive !== undefined ? isActive === 'true' : undefined;

    return this.listPatientsQuery.execute({
      clinicId: user.clinicId,
      isActive: filterIsActive,
    });
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.AUXILIARY)
  @ApiOperation({ summary: 'Consultar detalle de un paciente por ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Detalle del paciente',
    type: PatientResponseDto,
  })
  async getById(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PatientResponseDto> {
    return this.getPatientByIdQuery.execute({
      clinicId: user.clinicId,
      patientId: id,
    });
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.AUXILIARY)
  @ApiOperation({ summary: 'Actualizar datos demográficos de un paciente' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Paciente actualizado',
    type: PatientResponseDto,
  })
  async update(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePatientDto,
  ): Promise<PatientResponseDto> {
    return this.updatePatientUseCase.execute({
      clinicId: user.clinicId,
      patientId: id,
      ...dto,
    });
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Cambiar estado activo/inactivo del paciente (solo ADMIN)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estado del paciente actualizado',
    type: PatientResponseDto,
  })
  async changeStatus(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangePatientStatusDto,
  ): Promise<PatientResponseDto> {
    return this.changePatientStatusUseCase.execute({
      clinicId: user.clinicId,
      patientId: id,
      isActive: dto.isActive,
    });
  }
}
