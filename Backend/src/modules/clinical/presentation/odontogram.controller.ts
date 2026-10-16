import {
  Controller,
  Get,
  Put,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/presentation/guards/roles.guard';
import {
  CurrentUser,
  AuthenticatedUserPayload,
  Roles,
} from '../../../shared/presentation/decorators';
import { UserRole } from '../../identity';
import { UpsertPatientOdontogramUseCase } from '../application/use-cases/upsert-patient-odontogram.use-case';
import { CreateOdontogramSnapshotUseCase } from '../application/use-cases/create-odontogram-snapshot.use-case';
import { GetOdontogramByPatientQuery } from '../application/queries/get-odontogram-by-patient.query';
import { ListOdontogramSnapshotsQuery } from '../application/queries/list-odontogram-snapshots.query';
import { UpsertOdontogramDto } from './dto/upsert-odontogram.dto';
import { CreateOdontogramSnapshotDto } from './dto/create-odontogram-snapshot.dto';
import {
  OdontogramResponseDto,
  OdontogramSnapshotResponseDto,
} from './dto/odontogram-response.dto';

@ApiTags('Odontograms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('odontograms')
export class OdontogramController {
  constructor(
    private readonly upsertPatientOdontogramUseCase: UpsertPatientOdontogramUseCase,
    private readonly createOdontogramSnapshotUseCase: CreateOdontogramSnapshotUseCase,
    private readonly getOdontogramByPatientQuery: GetOdontogramByPatientQuery,
    private readonly listOdontogramSnapshotsQuery: ListOdontogramSnapshotsQuery,
  ) {}

  @Put('patient/:patientId')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Registrar o actualizar el odontograma estructurado del paciente' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Odontograma actualizado exitosamente',
    type: OdontogramResponseDto,
  })
  async upsert(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() dto: UpsertOdontogramDto,
  ): Promise<OdontogramResponseDto> {
    const result = await this.upsertPatientOdontogramUseCase.execute({
      clinicId: user.clinicId,
      patientId,
      hasTemporalDentition: dto.hasTemporalDentition,
      findings: dto.findings,
      expectedUpdatedAt: dto.expectedUpdatedAt,
    });

    return OdontogramResponseDto.fromDomain(result);
  }

  @Get('patient/:patientId')
  @Roles(UserRole.ADMIN, UserRole.AUXILIARY)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Consultar el odontograma estructurado del paciente' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Odontograma obtenido exitosamente',
    type: OdontogramResponseDto,
  })
  async getByPatient(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Param('patientId', ParseUUIDPipe) patientId: string,
  ): Promise<OdontogramResponseDto> {
    const result = await this.getOdontogramByPatientQuery.execute({
      clinicId: user.clinicId,
      patientId,
    });

    return OdontogramResponseDto.fromDomain(result);
  }

  @Post('patient/:patientId/snapshots')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Capturar una instantánea inmutable del odontograma actual' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Instantánea capturada exitosamente',
    type: OdontogramSnapshotResponseDto,
  })
  async createSnapshot(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() dto: CreateOdontogramSnapshotDto,
  ): Promise<OdontogramSnapshotResponseDto> {
    const result = await this.createOdontogramSnapshotUseCase.execute({
      clinicId: user.clinicId,
      patientId,
      notes: dto.notes,
    });

    return OdontogramSnapshotResponseDto.fromDomain(result);
  }

  @Get('patient/:patientId/snapshots')
  @Roles(UserRole.ADMIN, UserRole.AUXILIARY)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar las instantáneas históricas del odontograma del paciente' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de instantáneas obtenida exitosamente',
    type: [OdontogramSnapshotResponseDto],
  })
  async listSnapshots(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Param('patientId', ParseUUIDPipe) patientId: string,
  ): Promise<OdontogramSnapshotResponseDto[]> {
    const results = await this.listOdontogramSnapshotsQuery.execute({
      clinicId: user.clinicId,
      patientId,
    });

    return results.map((snap) => OdontogramSnapshotResponseDto.fromDomain(snap));
  }
}
