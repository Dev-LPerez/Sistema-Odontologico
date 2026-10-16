import {
  ClinicalHistoryPdfDocumentMapper,
  calculateAgeFromBogotaDates,
  formatDiagnosis,
  FINDING_LABELS,
  SURFACE_LABELS,
  FINDING_STATUS_LABELS,
  TREATMENT_ITEM_STATUS_LABELS,
} from './clinical-history-pdf-document.mapper';
import { Clinic } from '../../../identity';
import {
  Patient,
  DocumentIdentity,
  DocumentType,
  PhoneNumber,
  EmergencyContact,
  AcquisitionSource,
} from '../../../patients';
import { ClinicalHistory } from '../../domain/clinical-history.entity';
import { MedicalAntecedents } from '../../domain/medical-antecedents.vo';
import { TreatmentPlanItem } from '../../domain/treatment-plan-item.entity';
import { TreatmentItemStatus } from '../../domain/treatment-item-status.enum';
import { Odontogram } from '../../domain/odontogram.entity';
import { ToothNumber } from '../../domain/tooth-number.vo';
import { ToothFinding } from '../../domain/tooth-finding.vo';
import { ToothSurface } from '../../domain/tooth-surface.enum';
import { FindingCatalogCode } from '../../domain/finding-catalog.enum';
import { FindingStatus } from '../../domain/finding-status.enum';
import { ClinicalAttention } from '../../domain/clinical-attention.entity';
import { ClinicalAttentionStatus } from '../../domain/clinical-attention-status.enum';
import { ClockPort } from '../../../../shared/application/ports/clock.port';

describe('ClinicalHistoryPdfDocumentMapper', () => {
  describe('calculateAgeFromBogotaDates (Cálculo puro de edad sin desfase)', () => {
    const today = '2026-10-16';

    it('Caso 1: cumpleaños aún no ha ocurrido en el año actual (debe decrementar edad)', () => {
      // Nació el 17 de octubre (mañana): todavía tiene 25 años
      expect(calculateAgeFromBogotaDates(today, '2000-10-17')).toBe(25);
      // Nació en noviembre: todavía tiene 25 años
      expect(calculateAgeFromBogotaDates(today, '2000-11-01')).toBe(25);
    });

    it('Caso 2: día exacto del cumpleaños (debe cumplir la edad en el día actual)', () => {
      // Nació el 16 de octubre: hoy cumple exactamente 26 años
      expect(calculateAgeFromBogotaDates(today, '2000-10-16')).toBe(26);
    });

    it('Caso 3: cumpleaños ya ocurrió en el año actual (edad completa)', () => {
      // Nació el 15 de octubre (ayer): ya cumplió 26 años
      expect(calculateAgeFromBogotaDates(today, '2000-10-15')).toBe(26);
      // Nació en mayo: ya tiene 26 años
      expect(calculateAgeFromBogotaDates(today, '2000-05-15')).toBe(26);
    });

    it('Caso borde: fecha de nacimiento futura o recién nacido (edad mínima 0)', () => {
      expect(calculateAgeFromBogotaDates(today, '2027-01-01')).toBe(0);
      expect(calculateAgeFromBogotaDates(today, '2026-10-16')).toBe(0);
    });
  });

  describe('formatDiagnosis (Bug 2: formateo sin JSON crudo)', () => {
    it('debe formatear objeto completo { code, description } con guion medio tipográfico', () => {
      const diag = { code: 'K02.1', description: 'Caries de la dentina' };
      expect(formatDiagnosis(diag)).toBe('K02.1 – Caries de la dentina');
    });

    it('debe formatear objeto con solo description', () => {
      const diag = { description: 'Gingivitis marginal' };
      expect(formatDiagnosis(diag)).toBe('Gingivitis marginal');
    });

    it('debe formatear objeto con solo code', () => {
      const diag = { code: 'K05.0' };
      expect(formatDiagnosis(diag)).toBe('K05.0');
    });

    it('debe retornar directamente strings existentes', () => {
      expect(formatDiagnosis('Pulpitis irreversible sintomática')).toBe(
        'Pulpitis irreversible sintomática',
      );
    });

    it('debe manejar strings vacíos o valores null/undefined/vacíos de forma limpia sin lanzar error', () => {
      expect(formatDiagnosis(null)).toBe('');
      expect(formatDiagnosis(undefined)).toBe('');
      expect(formatDiagnosis({})).toBe('');
      expect(formatDiagnosis({ code: '', description: '' })).toBe('');
    });
  });

  describe('toDocumentData', () => {
    const fixedNow = new Date('2026-10-16T15:00:00.000Z');
    const clinicId = 'clinic-001';
    const patientId = 'patient-001';

    const mockClock: ClockPort = {
      now: () => fixedNow,
      todayInBogota: () => '2026-10-16',
      formatInBogota: (d: Date) => d.toISOString().slice(0, 10),
      formatDateTimeInBogota: (d: Date) => `${d.toISOString().slice(0, 10)} 10:00`,
      isSameDayInBogota: () => true,
    };

    const mockClinic = Clinic.create({
      id: clinicId,
      name: 'Clínica Dental Estética',
      address: 'Calle 100 # 15-20',
      phone: '3001234567',
      email: 'clinica@example.com',
      logoUrl: 'https://cdn.example.com/logo.png',
      createdAt: fixedNow,
      updatedAt: fixedNow,
    });

    const mockPatient = Patient.create({
      id: patientId,
      clinicId,
      firstName: 'Ana',
      lastName: 'Gómez',
      document: DocumentIdentity.create(DocumentType.CC, '52123456'),
      birthDate: new Date('1990-05-15T00:00:00.000Z'),
      phone: PhoneNumber.create('+573001112233'),
      email: 'ana.gomez@example.com',
      address: 'Carrera 7 # 45-10',
      emergencyContact: EmergencyContact.create(
        'Carlos Gómez',
        PhoneNumber.create('+573109998877'),
      ),
      acquisitionSource: AcquisitionSource.REFERRAL,
      dataTreatmentConsent: true,
      dataTreatmentConsentAt: fixedNow,
      isActive: true,
      createdAt: fixedNow,
      updatedAt: fixedNow,
    });

    const mockHistory = ClinicalHistory.create({
      id: 'history-001',
      clinicId,
      patientId,
      chiefComplaint: 'Dolor dental agudo',
      currentIllness: 'Evolución de 3 días con dolor punzante',
      medicalAntecedents: MedicalAntecedents.create({
        hypertension: false,
        diabetes: false,
        allergies: true,
        allergiesDetails: 'Alergia a la penicilina',
        medications: false,
        bleedingDisorders: false,
        pregnancy: false,
      }),
      clinicalExamination: 'Caries cavitada en 46',
      diagnoses: [{ code: 'K02.1', description: 'Caries de la dentina' }, 'Pulpitis reversible'],
      treatmentItems: [
        TreatmentPlanItem.create({
          id: 'item-1',
          clinicId,
          clinicalHistoryId: 'history-001',
          procedureId: 'proc-1',
          procedureCode: 'RES-01',
          procedureName: 'Restauración Resina',
          toothNumber: '46',
          status: TreatmentItemStatus.PENDING,
          estimatedCostCop: 150000,
          createdAt: fixedNow,
          updatedAt: fixedNow,
        }),
      ],
      createdAt: fixedNow,
      updatedAt: fixedNow,
    });

    const mockOdontogram = Odontogram.create({
      id: 'odon-001',
      clinicId,
      patientId,
      hasTemporalDentition: false,
      findings: [
        ToothFinding.create({
          toothNumber: ToothNumber.of('46'),
          surface: ToothSurface.OCCLUSAL,
          findingCode: FindingCatalogCode.CARIES,
          status: FindingStatus.EXISTING,
          notes: 'Caries oclusal',
          createdAt: fixedNow,
        }),
        ToothFinding.create({
          toothNumber: ToothNumber.of('11'),
          surface: ToothSurface.WHOLE_TOOTH,
          findingCode: FindingCatalogCode.CROWN,
          status: FindingStatus.PERFORMED,
          notes: 'Corona previa',
          createdAt: fixedNow,
        }),
      ],
      createdAt: fixedNow,
      updatedAt: fixedNow,
    });

    const earlierDate = new Date('2026-10-10T09:00:00.000Z');
    const laterDate = new Date('2026-10-15T16:30:00.000Z');

    const mockAttention1 = ClinicalAttention.create({
      id: 'att-1',
      clinicId,
      patientId,
      clinicalHistoryId: 'history-001',
      attendedByUserId: 'user-doc',
      status: ClinicalAttentionStatus.CLOSED,
      proceduresPerformed: [
        {
          code: 'EVA-01',
          name: 'Evaluación inicial',
          toothNumber: '46',
          surface: 'Oclusal',
        },
      ],
      evolutionNotes: 'Evaluación y diagnóstico inicial',
      privateNotes: 'INFORMACION_SECRETA_DOCTOR',
      attendedAt: earlierDate,
      createdAt: earlierDate,
      updatedAt: earlierDate,
    });

    const mockAttention2 = ClinicalAttention.create({
      id: 'att-2',
      clinicId,
      patientId,
      clinicalHistoryId: 'history-001',
      attendedByUserId: 'user-doc',
      status: ClinicalAttentionStatus.CLOSED,
      proceduresPerformed: [
        {
          code: 'RES-01',
          name: 'Restauración en resina',
          toothNumber: '46',
          surface: 'Oclusal',
        },
      ],
      evolutionNotes: 'Evolución favorable posterior a la restauración',
      privateNotes: 'OTRA_NOTA_CONFIDENCIAL',
      attendedAt: laterDate,
      createdAt: laterDate,
      updatedAt: laterDate,
    });

    it('debe mapear patient.birthDate como fecha calendario UTC estricta y calcular age en base a Bogota', () => {
      const data = ClinicalHistoryPdfDocumentMapper.toDocumentData({
        clinic: mockClinic,
        patient: mockPatient,
        history: mockHistory,
        odontogram: mockOdontogram,
        attentions: [mockAttention1],
        clock: mockClock,
      });

      expect(data.patient.birthDateFormatted).toBe('1990-05-15');
      expect(data.patient.age).toBe(36);
    });

    it('debe ordenar los dientes del odontograma numéricamente por código FDI ascendente', () => {
      const data = ClinicalHistoryPdfDocumentMapper.toDocumentData({
        clinic: mockClinic,
        patient: mockPatient,
        history: mockHistory,
        odontogram: mockOdontogram,
        attentions: [],
        clock: mockClock,
      });

      expect(data.odontogram).not.toBeNull();
      const keys = Object.keys(data.odontogram!.teeth);
      expect(keys).toEqual(['11', '46']); // 11 antes que 46
    });

    it('debe traducir hallazgos, superficies y estados de odontograma a español de Colombia (es-CO)', () => {
      const data = ClinicalHistoryPdfDocumentMapper.toDocumentData({
        clinic: mockClinic,
        patient: mockPatient,
        history: mockHistory,
        odontogram: mockOdontogram,
        attentions: [],
        clock: mockClock,
      });

      const tooth46Findings = data.odontogram!.teeth['46'];
      expect(tooth46Findings[0].findingCode).toBe('Caries');
      expect(tooth46Findings[0].surface).toBe('Oclusal');
      expect(tooth46Findings[0].status).toBe('Existente');

      const tooth11Findings = data.odontogram!.teeth['11'];
      expect(tooth11Findings[0].findingCode).toBe('Corona');
      expect(tooth11Findings[0].surface).toBe('Diente completo');
      expect(tooth11Findings[0].status).toBe('Realizado');
    });

    it('debe traducir el estado del plan de tratamiento y no incluir surface en treatmentItems', () => {
      const data = ClinicalHistoryPdfDocumentMapper.toDocumentData({
        clinic: mockClinic,
        patient: mockPatient,
        history: mockHistory,
        odontogram: null,
        attentions: [],
        clock: mockClock,
      });

      expect(data.history.treatmentItems[0].status).toBe('Pendiente');
      expect(
        (data.history.treatmentItems[0] as unknown as Record<string, unknown>).surface,
      ).toBeUndefined();
    });

    it('debe ordenar atenciones en orden cronológico ascendente y usar formatDateTimeInBogota', () => {
      // Pasamos las atenciones en orden invertido (laterDate primero, earlierDate segundo)
      const data = ClinicalHistoryPdfDocumentMapper.toDocumentData({
        clinic: mockClinic,
        patient: mockPatient,
        history: mockHistory,
        odontogram: null,
        attentions: [mockAttention2, mockAttention1],
        clock: mockClock,
      });

      expect(data.attentions).toHaveLength(2);
      expect(data.attentions[0].id).toBe('att-1');
      expect(data.attentions[1].id).toBe('att-2');
      expect(data.attentions[0].attendedAtFormatted).toBe('2026-10-10 10:00');
      expect(data.attentions[1].attendedAtFormatted).toBe('2026-10-15 10:00');
    });

    it('debe omitir estrictamente privateNotes de las atenciones (RC-023, RF-B-027)', () => {
      const data = ClinicalHistoryPdfDocumentMapper.toDocumentData({
        clinic: mockClinic,
        patient: mockPatient,
        history: mockHistory,
        odontogram: null,
        attentions: [mockAttention1],
        clock: mockClock,
      });

      expect(
        (data.attentions[0] as unknown as Record<string, unknown>).privateNotes,
      ).toBeUndefined();
      const stringified = JSON.stringify(data);
      expect(stringified).not.toContain('INFORMACION_SECRETA_DOCTOR');
    });

    it('debe manejar paciente sin contacto de emergencia y odontograma nulo', () => {
      const patientWithoutEmergency = Patient.create({
        id: 'patient-no-em',
        clinicId,
        firstName: 'Pedro',
        lastName: 'Pérez',
        document: DocumentIdentity.create(DocumentType.CC, '999888'),
        birthDate: new Date('1985-01-01T00:00:00.000Z'),
        phone: PhoneNumber.create('+573009998877'),
        acquisitionSource: AcquisitionSource.DIRECT,
        dataTreatmentConsent: true,
        dataTreatmentConsentAt: fixedNow,
        isActive: true,
        createdAt: fixedNow,
        updatedAt: fixedNow,
      });

      const data = ClinicalHistoryPdfDocumentMapper.toDocumentData({
        clinic: mockClinic,
        patient: patientWithoutEmergency,
        history: mockHistory,
        odontogram: null,
        attentions: [],
        clock: mockClock,
      });

      expect(data.patient.emergencyContact).toBeNull();
      expect(data.odontogram).toBeNull();
    });

    it('debe tener mapeos para todos los catálogos definidos en los diccionarios', () => {
      expect(FINDING_LABELS['RESIN_RESTORATION']).toBe('Restauración en resina');
      expect(FINDING_LABELS['AMALGAM_RESTORATION']).toBe('Restauración en amalgama');
      expect(FINDING_LABELS['ABSENT']).toBe('Ausente');
      expect(FINDING_LABELS['EXTRACTION_INDICATED']).toBe('Extracción indicada');
      expect(FINDING_LABELS['CALCULUS']).toBe('Cálculo');
      expect(FINDING_LABELS['PERIODONTAL_POCKET']).toBe('Bolsa periodontal');
      expect(FINDING_LABELS['ENDODONTICS']).toBe('Endodoncia');
      expect(FINDING_LABELS['SEALANT']).toBe('Sellante');
      expect(FINDING_LABELS['FRACTURE']).toBe('Fractura');

      expect(SURFACE_LABELS['VESTIBULAR']).toBe('Vestibular');
      expect(SURFACE_LABELS['LINGUAL']).toBe('Lingual/Palatina');
      expect(SURFACE_LABELS['MESIAL']).toBe('Mesial');
      expect(SURFACE_LABELS['DISTAL']).toBe('Distal');

      expect(FINDING_STATUS_LABELS['PLANNED']).toBe('Planificado');
      expect(TREATMENT_ITEM_STATUS_LABELS['IN_PROGRESS']).toBe('En curso');
      expect(TREATMENT_ITEM_STATUS_LABELS['COMPLETED']).toBe('Realizado');
    });

    it('debe cubrir branches de fallback cuando los códigos de catálogo no están en los diccionarios o surface es null', () => {
      // Mock de odontograma con superficie nula y códigos no reconocidos
      const customOdontogram = {
        hasTemporalDentition: false,
        toStructuredJson: () => ({
          teeth: {
            '11': [
              {
                findingCode: 'UNKNOWN_FINDING',
                surface: null,
                status: 'UNKNOWN_STATUS',
                notes: 'Test fallback surface null',
              },
              {
                findingCode: 'UNKNOWN_FINDING_2',
                surface: 'UNKNOWN_SURFACE',
                status: 'UNKNOWN_STATUS_2',
                notes: 'Test fallback unknown surface',
              },
            ],
          },
        }),
      } as unknown as Odontogram;

      const customHistory = {
        chiefComplaint: 'Consulta',
        currentIllness: 'Ninguna',
        medicalAntecedents: {
          hypertension: false,
          diabetes: false,
          allergies: false,
          medications: false,
          bleedingDisorders: false,
          pregnancy: false,
        },
        clinicalExamination: null,
        diagnoses: [],
        treatmentItems: [
          {
            procedureCode: 'PROC-99',
            procedureName: 'Procedimiento Custom',
            toothNumber: '11',
            status: 'CUSTOM_TREATMENT_STATUS',
            estimatedCostCop: 50000,
          },
        ],
        totalEstimatedCostCop: 50000,
        createdAt: fixedNow,
      } as unknown as ClinicalHistory;

      // Clock sin formatDateTimeInBogota para activar el fallback a formatInBogota
      const clockWithoutDateTime: ClockPort = {
        now: () => fixedNow,
        todayInBogota: () => '2026-10-16',
        formatInBogota: (d: Date) => d.toISOString().slice(0, 10),
        isSameDayInBogota: () => true,
      };

      const data = ClinicalHistoryPdfDocumentMapper.toDocumentData({
        clinic: mockClinic,
        patient: mockPatient,
        history: customHistory,
        odontogram: customOdontogram,
        attentions: [mockAttention1],
        clock: clockWithoutDateTime,
      });

      const tooth11Findings = data.odontogram!.teeth['11'];
      expect(tooth11Findings[0].findingCode).toBe('UNKNOWN_FINDING');
      expect(tooth11Findings[0].surface).toBeNull();
      expect(tooth11Findings[0].status).toBe('UNKNOWN_STATUS');

      expect(tooth11Findings[1].findingCode).toBe('UNKNOWN_FINDING_2');
      expect(tooth11Findings[1].surface).toBe('UNKNOWN_SURFACE');
      expect(tooth11Findings[1].status).toBe('UNKNOWN_STATUS_2');

      expect(data.history.treatmentItems[0].status).toBe('CUSTOM_TREATMENT_STATUS');
      expect(data.history.createdAtFormatted).toBe('2026-10-16');
      expect(data.attentions[0].attendedAtFormatted).toBe('2026-10-10');
    });
  });
});
