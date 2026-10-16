import {
  Controller,
  Get,
  Post,
  Patch,
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
import { CreateClinicalAttentionUseCase } from '../application/use-cases/create-clinical-attention.use-case';
import { UpdateClinicalAttentionUseCase } from '../application/use-cases/update-clinical-attention.use-case';
import { AddAttentionMaterialUsedUseCase } from '../application/use-cases/add-attention-material-used.use-case';
import { ListClinicalAttentionsByPatientQuery } from '../application/queries/list-clinical-attentions-by-patient.query';
import { GetClinicalAttentionByIdQuery } from '../application/queries/get-clinical-attention-by-id.query';
import { CreateClinicalAttentionDto } from './dto/create-clinical-attention.dto';
import { UpdateClinicalAttentionDto } from './dto/update-clinical-attention.dto';
import { AddAttentionMaterialUsedDto } from './dto/add-attention-material-used.dto';
import { ClinicalAttentionResponseDto } from './dto/clinical-attention-response.dto';

@ApiTags('Clinical Attentions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('clinical-attentions')
export class ClinicalAttentionsController {
  constructor(
    private readonly createClinicalAttentionUseCase: CreateClinicalAttentionUseCase,
    private readonly updateClinicalAttentionUseCase: UpdateClinicalAttentionUseCase,
    private readonly addAttentionMaterialUsedUseCase: AddAttentionMaterialUsedUseCase,
    private readonly listClinicalAttentionsByPatientQuery: ListClinicalAttentionsByPatientQuery,
    private readonly getClinicalAttentionByIdQuery: GetClinicalAttentionByIdQuery,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar una nueva atención clínica' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Atención clínica registrada exitosamente',
    type: ClinicalAttentionResponseDto,
  })
  async create(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Body() dto: CreateClinicalAttentionDto,
  ): Promise<ClinicalAttentionResponseDto> {
    const attention = await this.createClinicalAttentionUseCase.execute({
      clinicId: user.clinicId,
      patientId: dto.patientId,
      attendedByUserId: user.sub,
      evolutionNotes: dto.evolutionNotes,
      prescription: dto.prescription,
      postOperativeIndications: dto.postOperativeIndications,
      privateNotes: dto.privateNotes,
      proceduresPerformed: dto.proceduresPerformed,
      attendedAt: dto.attendedAt ? new Date(dto.attendedAt) : undefined,
    });

    return ClinicalAttentionResponseDto.fromDomain(attention);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar una atención clínica abierta' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Atención clínica actualizada exitosamente',
    type: ClinicalAttentionResponseDto,
  })
  async update(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClinicalAttentionDto,
  ): Promise<ClinicalAttentionResponseDto> {
    const attention = await this.updateClinicalAttentionUseCase.execute({
      clinicId: user.clinicId,
      id,
      evolutionNotes: dto.evolutionNotes,
      prescription: dto.prescription,
      postOperativeIndications: dto.postOperativeIndications,
      privateNotes: dto.privateNotes,
      proceduresPerformed: dto.proceduresPerformed,
    });

    return ClinicalAttentionResponseDto.fromDomain(attention);
  }

  @Post(':id/materials')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar material propio utilizado en la atención clínica' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Material registrado y existencias descontadas exitosamente',
    type: ClinicalAttentionResponseDto,
  })
  async addMaterial(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddAttentionMaterialUsedDto,
  ): Promise<ClinicalAttentionResponseDto> {
    const attention = await this.addAttentionMaterialUsedUseCase.execute({
      clinicId: user.clinicId,
      attentionId: id,
      materialId: dto.materialId,
      quantity: dto.quantity,
      toothNumber: dto.toothNumber,
      notes: dto.notes,
    });

    return ClinicalAttentionResponseDto.fromDomain(attention);
  }

  @Get('patient/:patientId')
  @Roles(UserRole.ADMIN, UserRole.AUXILIARY)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar las atenciones clínicas de un paciente' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Listado de atenciones clínicas obtenido exitosamente',
    type: [ClinicalAttentionResponseDto],
  })
  async listByPatient(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Param('patientId', ParseUUIDPipe) patientId: string,
  ): Promise<ClinicalAttentionResponseDto[]> {
    const attentions = await this.listClinicalAttentionsByPatientQuery.execute({
      clinicId: user.clinicId,
      patientId,
      viewerRole: user.role as UserRole,
    });

    return attentions.map((a) => ClinicalAttentionResponseDto.fromDomain(a));
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.AUXILIARY)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener el detalle de una atención clínica por ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Detalle de la atención clínica obtenido exitosamente',
    type: ClinicalAttentionResponseDto,
  })
  async getById(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ClinicalAttentionResponseDto> {
    const attention = await this.getClinicalAttentionByIdQuery.execute({
      clinicId: user.clinicId,
      id,
      viewerRole: user.role as UserRole,
    });

    return ClinicalAttentionResponseDto.fromDomain(attention);
  }
}
