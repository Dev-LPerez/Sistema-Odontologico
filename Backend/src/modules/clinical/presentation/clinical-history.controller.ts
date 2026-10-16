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
  StreamableFile,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/presentation/guards/roles.guard';
import {
  CurrentUser,
  AuthenticatedUserPayload,
  Roles,
} from '../../../shared/presentation/decorators';
import { UserRole } from '../../identity';
import { CreateClinicalHistoryUseCase } from '../application/use-cases/create-clinical-history.use-case';
import { UpdateClinicalHistoryUseCase } from '../application/use-cases/update-clinical-history.use-case';
import { AddTreatmentPlanItemUseCase } from '../application/use-cases/add-treatment-plan-item.use-case';
import { UpdateTreatmentPlanItemStatusUseCase } from '../application/use-cases/update-treatment-plan-item-status.use-case';
import { GetClinicalHistoryByPatientQuery } from '../application/queries/get-clinical-history-by-patient.query';
import { ExportClinicalHistoryPdfQuery } from '../application/queries/export-clinical-history-pdf.query';
import { CreateClinicalHistoryDto } from './dto/create-clinical-history.dto';
import { UpdateClinicalHistoryDto } from './dto/update-clinical-history.dto';
import { AddTreatmentPlanItemDto } from './dto/add-treatment-plan-item.dto';
import { UpdateTreatmentItemStatusDto } from './dto/update-treatment-item-status.dto';
import {
  ClinicalHistoryResponseDto,
  TreatmentPlanItemResponseDto,
} from './dto/clinical-history-response.dto';

@ApiTags('Clinical Histories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('clinical-histories')
export class ClinicalHistoryController {
  constructor(
    private readonly createClinicalHistoryUseCase: CreateClinicalHistoryUseCase,
    private readonly updateClinicalHistoryUseCase: UpdateClinicalHistoryUseCase,
    private readonly addTreatmentPlanItemUseCase: AddTreatmentPlanItemUseCase,
    private readonly updateTreatmentPlanItemStatusUseCase: UpdateTreatmentPlanItemStatusUseCase,
    private readonly getClinicalHistoryByPatientQuery: GetClinicalHistoryByPatientQuery,
    private readonly exportClinicalHistoryPdfQuery: ExportClinicalHistoryPdfQuery,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Abrir la historia clínica única de un paciente' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Historia clínica creada exitosamente',
    type: ClinicalHistoryResponseDto,
  })
  async create(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Body() dto: CreateClinicalHistoryDto,
  ): Promise<ClinicalHistoryResponseDto> {
    const history = await this.createClinicalHistoryUseCase.execute({
      clinicId: user.clinicId,
      patientId: dto.patientId,
      chiefComplaint: dto.chiefComplaint,
      currentIllness: dto.currentIllness,
      personalAntecedents: dto.personalAntecedents,
      familyAntecedents: dto.familyAntecedents,
      clinicalExamination: dto.clinicalExamination,
      diagnoses: dto.diagnoses,
    });

    return ClinicalHistoryResponseDto.fromDomain(history);
  }

  @Patch('patient/:patientId')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar antecedentes, examen y diagnósticos de la historia clínica',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Historia clínica actualizada exitosamente',
    type: ClinicalHistoryResponseDto,
  })
  async update(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() dto: UpdateClinicalHistoryDto,
  ): Promise<ClinicalHistoryResponseDto> {
    const history = await this.updateClinicalHistoryUseCase.execute({
      clinicId: user.clinicId,
      patientId,
      chiefComplaint: dto.chiefComplaint,
      currentIllness: dto.currentIllness,
      personalAntecedents: dto.personalAntecedents,
      familyAntecedents: dto.familyAntecedents,
      clinicalExamination: dto.clinicalExamination,
      diagnoses: dto.diagnoses,
    });

    return ClinicalHistoryResponseDto.fromDomain(history);
  }

  @Get('patient/:patientId')
  @Roles(UserRole.ADMIN, UserRole.AUXILIARY)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Consultar la historia clínica completa de un paciente' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Historia clínica obtenida exitosamente',
    type: ClinicalHistoryResponseDto,
  })
  async getByPatient(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Param('patientId', ParseUUIDPipe) patientId: string,
  ): Promise<ClinicalHistoryResponseDto> {
    const history = await this.getClinicalHistoryByPatientQuery.execute({
      clinicId: user.clinicId,
      patientId,
    });

    return ClinicalHistoryResponseDto.fromDomain(history);
  }

  @Post('patient/:patientId/treatment-plan-items')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Agregar un ítem o procedimiento al plan de tratamiento' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Ítem agregado exitosamente al plan de tratamiento',
    type: TreatmentPlanItemResponseDto,
  })
  async addTreatmentPlanItem(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() dto: AddTreatmentPlanItemDto,
  ): Promise<TreatmentPlanItemResponseDto> {
    const item = await this.addTreatmentPlanItemUseCase.execute({
      clinicId: user.clinicId,
      patientId,
      procedureId: dto.procedureId,
      toothNumber: dto.toothNumber,
      estimatedCostCop: dto.estimatedCostCop,
      notes: dto.notes,
    });

    return TreatmentPlanItemResponseDto.fromDomain(item);
  }

  @Patch('patient/:patientId/treatment-plan-items/:itemId/status')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar el estado de un ítem del plan de tratamiento' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estado del ítem actualizado exitosamente',
    type: TreatmentPlanItemResponseDto,
  })
  async updateTreatmentItemStatus(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateTreatmentItemStatusDto,
  ): Promise<TreatmentPlanItemResponseDto> {
    const item = await this.updateTreatmentPlanItemStatusUseCase.execute({
      clinicId: user.clinicId,
      patientId,
      itemId,
      status: dto.status,
    });

    return TreatmentPlanItemResponseDto.fromDomain(item);
  }

  @Get('patient/:patientId/pdf')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exportar la historia clínica completa del paciente en formato PDF' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Documento PDF generado exitosamente',
    content: {
      'application/pdf': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async exportPdf(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const result = await this.exportClinicalHistoryPdfQuery.execute({
      clinicId: user.clinicId,
      patientId,
    });

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);

    return new StreamableFile(result.buffer);
  }
}
