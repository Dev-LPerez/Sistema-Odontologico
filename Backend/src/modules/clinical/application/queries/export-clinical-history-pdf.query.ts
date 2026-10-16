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
  ClinicalHistoryPdfDocumentData,
  ClinicalHistoryPdfToothFindingData,
} from '../ports/clinical-history-pdf-generator.port';
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

    const now = this.clock.now();
    let age = now.getFullYear() - patient.birthDate.getFullYear();
    const monthDiff = now.getMonth() - patient.birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < patient.birthDate.getDate())) {
      age--;
    }
    age = Math.max(0, age);

    const documentData: ClinicalHistoryPdfDocumentData = {
      clinic: {
        name: clinic.name,
        address: clinic.address,
        phone: clinic.phone,
        email: clinic.email,
        logoUrl: clinic.logoUrl,
      },
      patient: {
        id: patient.id,
        fullName: `${patient.firstName} ${patient.lastName}`,
        documentType: patient.document.type,
        documentNumber: patient.document.number,
        birthDateFormatted: this.clock.formatInBogota(patient.birthDate),
        age,
        phone: patient.phone.value,
        email: patient.email,
        address: patient.address,
        emergencyContact: patient.emergencyContact
          ? {
              name: patient.emergencyContact.name,
              phone: patient.emergencyContact.phone.value,
            }
          : null,
      },
      history: {
        chiefComplaint: history.chiefComplaint,
        currentIllness: history.currentIllness,
        medicalAntecedents: {
          hypertension: history.medicalAntecedents.hypertension,
          diabetes: history.medicalAntecedents.diabetes,
          allergies: history.medicalAntecedents.allergies,
          allergiesDetails: history.medicalAntecedents.allergiesDetails,
          medications: history.medicalAntecedents.medications,
          medicationsDetails: history.medicalAntecedents.medicationsDetails,
          bleedingDisorders: history.medicalAntecedents.bleedingDisorders,
          pregnancy: history.medicalAntecedents.pregnancy,
          otherNotes: history.medicalAntecedents.otherNotes,
          familyAntecedents: history.medicalAntecedents.familyAntecedents,
        },
        clinicalExamination: history.clinicalExamination,
        diagnoses: history.diagnoses.map((d) => (typeof d === 'string' ? d : JSON.stringify(d))),
        treatmentItems: history.treatmentItems.map((item) => ({
          procedureCode: item.procedureCode,
          procedureName: item.procedureName,
          toothNumber: item.toothNumber,
          surface: null,
          status: item.status,
          estimatedCostCop: item.estimatedCostCop,
        })),
        totalEstimatedCostCop: history.totalEstimatedCostCop,
        createdAtFormatted: this.clock.formatInBogota(history.createdAt),
      },
      odontogram: odontogram
        ? {
            hasTemporalDentition: odontogram.hasTemporalDentition,
            teeth: Object.fromEntries(
              Object.entries(odontogram.toStructuredJson().teeth).map(([tooth, findings]) => [
                tooth,
                findings.map((f): ClinicalHistoryPdfToothFindingData => ({
                  findingCode: f.findingCode,
                  surface: f.surface,
                  status: f.status,
                  notes: f.notes,
                })),
              ]),
            ),
          }
        : null,
      attentions: attentions.map((att) => ({
        id: att.id,
        attendedAtFormatted: this.clock.formatInBogota(att.attendedAt),
        evolutionNotes: att.evolutionNotes,
        prescription: att.prescription,
        postOperativeIndications: att.postOperativeIndications,
        proceduresPerformed: att.proceduresPerformed.map((p) => ({
          code: p.code,
          name: p.name,
          toothNumber: p.toothNumber,
          surface: p.surface,
          notes: p.notes,
        })),
        materialsUsed: att.materialsUsed.map((m) => ({
          brand: m.brand,
          reference: m.reference,
          type: m.type,
          color: m.color,
          toothNumber: m.toothNumber,
          quantity: m.quantity,
          notes: m.notes,
        })),
        // privateNotes se omite intencionalmente conforme a RF-B-027 y RC-023
      })),
      generatedAtFormatted: this.clock.formatInBogota(now),
    };

    const buffer = await this.pdfGenerator.generate(documentData);

    return {
      buffer,
      filename: `historia-clinica-${patient.id}.pdf`,
      contentType: 'application/pdf',
    };
  }
}
