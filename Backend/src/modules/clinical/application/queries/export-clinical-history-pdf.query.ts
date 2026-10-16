import { Inject, Injectable } from '@nestjs/common';
import {
  CLINIC_REPOSITORY_PORT,
  ClinicRepositoryPort,
  ClinicNotFoundError,
} from '../../../identity';
import {
  PATIENT_REPOSITORY_TOKEN,
  PatientRepositoryPort,
  PatientNotFoundError,
} from '../../../patients';
import {
  CLINICAL_HISTORY_REPOSITORY_PORT,
  ClinicalHistoryRepositoryPort,
} from '../../domain/clinical-history.repository.port';
import {
  ODONTOGRAM_REPOSITORY_PORT,
  OdontogramRepositoryPort,
} from '../../domain/odontogram.repository.port';
import {
  CLINICAL_ATTENTION_REPOSITORY_PORT,
  ClinicalAttentionRepositoryPort,
} from '../../domain/clinical-attention.repository.port';
import {
  CLINICAL_HISTORY_PDF_GENERATOR_PORT,
  ClinicalHistoryPdfGeneratorPort,
} from '../ports/clinical-history-pdf-generator.port';
import { ClinicalHistoryPdfDocumentMapper } from '../mappers/clinical-history-pdf-document.mapper';
import { CLOCK_PORT, ClockPort } from '../../../../shared/application/ports/clock.port';
import { ClinicalHistoryNotFoundError } from '../../domain/clinical.errors';

export interface ExportClinicalHistoryPdfParams {
  clinicId: string;
  patientId: string;
}

export interface ExportClinicalHistoryPdfResult {
  buffer: Buffer;
  filename: string;
  contentType: 'application/pdf';
}

@Injectable()
export class ExportClinicalHistoryPdfQuery {
  constructor(
    @Inject(CLINIC_REPOSITORY_PORT)
    private readonly clinicRepo: ClinicRepositoryPort,
    @Inject(PATIENT_REPOSITORY_TOKEN)
    private readonly patientRepo: PatientRepositoryPort,
    @Inject(CLINICAL_HISTORY_REPOSITORY_PORT)
    private readonly historyRepo: ClinicalHistoryRepositoryPort,
    @Inject(ODONTOGRAM_REPOSITORY_PORT)
    private readonly odontogramRepo: OdontogramRepositoryPort,
    @Inject(CLINICAL_ATTENTION_REPOSITORY_PORT)
    private readonly attentionRepo: ClinicalAttentionRepositoryPort,
    @Inject(CLINICAL_HISTORY_PDF_GENERATOR_PORT)
    private readonly pdfGenerator: ClinicalHistoryPdfGeneratorPort,
    @Inject(CLOCK_PORT)
    private readonly clock: ClockPort,
  ) {}

  async execute(params: ExportClinicalHistoryPdfParams): Promise<ExportClinicalHistoryPdfResult> {
    const clinic = await this.clinicRepo.findById(params.clinicId);
    if (!clinic) {
      throw new ClinicNotFoundError(params.clinicId);
    }

    const patient = await this.patientRepo.findById(params.clinicId, params.patientId);
    if (!patient) {
      throw new PatientNotFoundError(params.patientId);
    }

    const history = await this.historyRepo.findByPatientId(params.clinicId, params.patientId);
    if (!history) {
      throw new ClinicalHistoryNotFoundError(params.patientId);
    }

    const odontogram = await this.odontogramRepo.findByPatientId(params.clinicId, params.patientId);
    const attentions = await this.attentionRepo.findAllByPatientId(
      params.clinicId,
      params.patientId,
    );

    const documentData = ClinicalHistoryPdfDocumentMapper.toDocumentData({
      clinic,
      patient,
      history,
      odontogram,
      attentions,
      clock: this.clock,
    });

    const buffer = await this.pdfGenerator.generate(documentData);

    return {
      buffer,
      filename: `historia-clinica-${patient.id}.pdf`,
      contentType: 'application/pdf',
    };
  }
}
