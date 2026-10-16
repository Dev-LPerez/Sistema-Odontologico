import { Clinic } from '../../../identity';
import { Patient } from '../../../patients';
import { ClinicalHistory } from '../../domain/clinical-history.entity';
import { Odontogram } from '../../domain/odontogram.entity';
import { ClinicalAttention } from '../../domain/clinical-attention.entity';
import { ClockPort } from '../../../../shared/application/ports/clock.port';
import {
  ClinicalHistoryPdfDocumentData,
  ClinicalHistoryPdfToothFindingData,
} from '../ports/clinical-history-pdf-generator.port';

export const FINDING_LABELS: Record<string, string> = {
  CARIES: 'Caries',
  RESIN_RESTORATION: 'Restauración en resina',
  AMALGAM_RESTORATION: 'Restauración en amalgama',
  ABSENT: 'Ausente',
  EXTRACTION_INDICATED: 'Extracción indicada',
  CALCULUS: 'Cálculo',
  PERIODONTAL_POCKET: 'Bolsa periodontal',
  CROWN: 'Corona',
  ENDODONTICS: 'Endodoncia',
  SEALANT: 'Sellante',
  FRACTURE: 'Fractura',
};

export const SURFACE_LABELS: Record<string, string> = {
  OCCLUSAL: 'Oclusal',
  VESTIBULAR: 'Vestibular',
  LINGUAL: 'Lingual/Palatina',
  MESIAL: 'Mesial',
  DISTAL: 'Distal',
  WHOLE_TOOTH: 'Diente completo',
};

export const FINDING_STATUS_LABELS: Record<string, string> = {
  EXISTING: 'Existente',
  PLANNED: 'Planificado',
  PERFORMED: 'Realizado',
};

export const TREATMENT_ITEM_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En curso',
  COMPLETED: 'Realizado',
};

export function calculateAgeFromBogotaDates(
  todayInBogota: string,
  birthDateFormatted: string,
): number {
  const [todayYear, todayMonth, todayDay] = todayInBogota.split('-').map(Number);
  const [birthYear, birthMonth, birthDay] = birthDateFormatted.split('-').map(Number);

  let age = todayYear - birthYear;
  const monthDiff = todayMonth - birthMonth;
  if (monthDiff < 0 || (monthDiff === 0 && todayDay < birthDay)) {
    age--;
  }

  return Math.max(0, age);
}

function extractTrimmedField(obj: Record<string, unknown>, key: string): string | null {
  const val = obj[key];
  return typeof val === 'string' && val.trim().length > 0 ? val.trim() : null;
}

export function formatDiagnosis(d: unknown): string {
  if (typeof d === 'string') {
    return d.trim();
  }
  if (!d || typeof d !== 'object') {
    return '';
  }
  const obj = d as Record<string, unknown>;
  const code = extractTrimmedField(obj, 'code');
  const description = extractTrimmedField(obj, 'description');

  if (code && description) {
    return `${code} – ${description}`;
  }
  return description ?? code ?? '';
}

export interface MapToPdfDocumentDataInput {
  clinic: Clinic;
  patient: Patient;
  history: ClinicalHistory;
  odontogram?: Odontogram | null;
  attentions: ClinicalAttention[];
  clock: ClockPort;
}

export class ClinicalHistoryPdfDocumentMapper {
  static toDocumentData(input: MapToPdfDocumentDataInput): ClinicalHistoryPdfDocumentData {
    const { clinic, patient, history, odontogram, attentions, clock } = input;

    const birthDateFormatted = patient.birthDate.toISOString().slice(0, 10);
    const age = calculateAgeFromBogotaDates(clock.todayInBogota(), birthDateFormatted);

    const sortedAttentions = [...attentions].sort(
      (a, b) => a.attendedAt.getTime() - b.attendedAt.getTime(),
    );

    let odontogramData = null;
    if (odontogram) {
      const structured = odontogram.toStructuredJson();
      const sortedTeethKeys = Object.keys(structured.teeth).sort(
        (a, b) => parseInt(a, 10) - parseInt(b, 10),
      );

      const teeth: Record<string, ClinicalHistoryPdfToothFindingData[]> = {};
      for (const tooth of sortedTeethKeys) {
        teeth[tooth] = structured.teeth[tooth].map((f) => ({
          findingCode: FINDING_LABELS[f.findingCode] ?? f.findingCode,
          surface: f.surface ? (SURFACE_LABELS[f.surface] ?? f.surface) : null,
          status: FINDING_STATUS_LABELS[f.status] ?? f.status,
          notes: f.notes,
        }));
      }

      odontogramData = {
        hasTemporalDentition: odontogram.hasTemporalDentition,
        teeth,
      };
    }

    const formatDateTime = (d: Date) =>
      clock.formatDateTimeInBogota ? clock.formatDateTimeInBogota(d) : clock.formatInBogota(d);

    return {
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
        birthDateFormatted,
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
        diagnoses: history.diagnoses.map(formatDiagnosis),
        treatmentItems: history.treatmentItems.map((item) => ({
          procedureCode: item.procedureCode,
          procedureName: item.procedureName,
          toothNumber: item.toothNumber,
          status: TREATMENT_ITEM_STATUS_LABELS[item.status] ?? item.status,
          estimatedCostCop: item.estimatedCostCop,
        })),
        totalEstimatedCostCop: history.totalEstimatedCostCop,
        createdAtFormatted: formatDateTime(history.createdAt),
      },
      odontogram: odontogramData,
      attentions: sortedAttentions.map((att) => ({
        id: att.id,
        attendedAtFormatted: formatDateTime(att.attendedAt),
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
      })),
      generatedAtFormatted: formatDateTime(clock.now()),
    };
  }
}
