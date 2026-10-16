import { ExportClinicalHistoryPdfQuery } from './export-clinical-history-pdf.query';
import { ClinicRepositoryPort, Clinic, ClinicNotFoundError } from '../../../identity';
import {
  PatientRepositoryPort,
  DocumentIdentity,
  DocumentType,
  PhoneNumber,
  AcquisitionSource,
  Patient,
  PatientNotFoundError,
} from '../../../patients';
import { ClinicalHistoryRepositoryPort } from '../../domain/clinical-history.repository.port';
import { OdontogramRepositoryPort } from '../../domain/odontogram.repository.port';
import { ClinicalAttentionRepositoryPort } from '../../domain/clinical-attention.repository.port';
import {
  ClinicalHistoryPdfGeneratorPort,
  ClinicalHistoryPdfDocumentData,
} from '../ports/clinical-history-pdf-generator.port';
import { ClockPort } from '../../../../shared/application/ports/clock.port';
import { ClinicalHistoryNotFoundError } from '../../domain/clinical.errors';
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
import { AttentionMaterialUsed } from '../../domain/attention-material-used.entity';

describe('ExportClinicalHistoryPdfQuery', () => {
  let query: ExportClinicalHistoryPdfQuery;
  let clinicRepo: jest.Mocked<ClinicRepositoryPort>;
  let patientRepo: jest.Mocked<PatientRepositoryPort>;
  let historyRepo: jest.Mocked<ClinicalHistoryRepositoryPort>;
  let odontogramRepo: jest.Mocked<OdontogramRepositoryPort>;
  let attentionRepo: jest.Mocked<ClinicalAttentionRepositoryPort>;
  let pdfGenerator: jest.Mocked<ClinicalHistoryPdfGeneratorPort>;
  let clock: jest.Mocked<ClockPort>;

  const fixedNow = new Date('2026-10-16T15:00:00.000Z');
  const clinicId = 'clinic-123';
  const patientId = 'patient-456';

  const mockClinic = Clinic.create({
    id: clinicId,
    name: 'Consultorio Dra. Angelee Pacheco',
    address: 'Calle 100 # 15-20, Bogotá',
    phone: '3001234567',
    email: 'contacto@dra-pacheco.com',
    createdAt: fixedNow,
    updatedAt: fixedNow,
  });

  const mockPatient = Patient.create({
    id: patientId,
    clinicId,
    firstName: 'Juan',
    lastName: 'Pérez',
    document: DocumentIdentity.create(DocumentType.CC, '1020304050'),
    birthDate: new Date('1990-05-15T00:00:00.000Z'),
    phone: PhoneNumber.create('+573109876543'),
    email: 'juan.perez@example.com',
    address: 'Carrera 7 # 45-10',
    acquisitionSource: AcquisitionSource.REFERRAL,
    dataTreatmentConsent: true,
    dataTreatmentConsentAt: fixedNow,
    isActive: true,
    createdAt: fixedNow,
    updatedAt: fixedNow,
  });

  const mockHistory = ClinicalHistory.create({
    id: 'history-789',
    clinicId,
    patientId,
    chiefComplaint: 'Dolor severo en molar inferior derecho',
    currentIllness: 'Paciente refiere dolor agudo de 3 días de evolución',
    medicalAntecedents: MedicalAntecedents.create({
      hypertension: true,
      diabetes: false,
      allergies: true,
      allergiesDetails: 'Alergia a la penicilina',
      medications: true,
      medicationsDetails: 'Losartán 50mg',
      bleedingDisorders: false,
      pregnancy: false,
      otherNotes: 'Sin antecedentes quirúrgicos',
      familyAntecedents: 'Madre con diabetes',
    }),
    clinicalExamination: 'Caries profunda en diente 46 con compromiso pulpar',
    diagnoses: ['Pulpitis irreversible sintomática'],
    treatmentItems: [
      TreatmentPlanItem.create({
        id: 'item-1',
        clinicId,
        clinicalHistoryId: 'history-789',
        procedureId: 'proc-1',
        procedureCode: 'END-01',
        procedureName: 'Endodoncia molar',
        toothNumber: '46',
        status: TreatmentItemStatus.PENDING,
        estimatedCostCop: 350000,
        createdAt: fixedNow,
        updatedAt: fixedNow,
      }),
    ],
    createdAt: fixedNow,
    updatedAt: fixedNow,
  });

  const mockOdontogram = Odontogram.create({
    id: 'odon-1',
    clinicId,
    patientId,
    hasTemporalDentition: false,
    findings: [
      ToothFinding.create({
        toothNumber: ToothNumber.of('46'),
        surface: ToothSurface.OCCLUSAL,
        findingCode: FindingCatalogCode.CARIES,
        status: FindingStatus.EXISTING,
        notes: 'Caries cavitada activa',
        createdAt: fixedNow,
      }),
    ],
    createdAt: fixedNow,
    updatedAt: fixedNow,
  });

  const mockAttention = ClinicalAttention.create({
    id: 'att-1',
    clinicId,
    patientId,
    clinicalHistoryId: 'history-789',
    attendedByUserId: 'user-doc',
    status: ClinicalAttentionStatus.CLOSED,
    proceduresPerformed: [
      {
        code: 'END-01',
        name: 'Apertura cameral y pulpectomía',
        toothNumber: '46',
        surface: 'Oclusal',
        notes: 'Conductometría electrónica',
      },
    ],
    evolutionNotes: 'Obturación oclusal en diente 16',
    prescription: 'Ibuprofeno 600mg cada 8 horas por 3 días',
    postOperativeIndications: 'No masticar alimentos duros del lado derecho',
    privateNotes: 'Nota confidencial secreta de la doctora',
    attendedAt: fixedNow,
    createdAt: fixedNow,
    updatedAt: fixedNow,
    materialsUsed: [
      AttentionMaterialUsed.create({
        id: 'mat-1',
        clinicId,
        attentionId: 'att-1',
        materialId: 'mat-resina-id',
        brand: '3M',
        reference: 'Filtek Z350',
        type: 'Resina',
        color: 'A2',
        toothNumber: '46',
        quantity: 1,
        notes: 'Incrementos de 2mm',
        createdAt: fixedNow,
      }),
    ],
  });

  beforeEach(() => {
    clinicRepo = {
      findById: jest.fn().mockResolvedValue(mockClinic),
      save: jest.fn(),
    };
    patientRepo = {
      findById: jest.fn().mockResolvedValue(mockPatient),
      findByDocument: jest.fn(),
      findPotentialDuplicates: jest.fn(),
      findAllByClinicId: jest.fn(),
      save: jest.fn(),
    };
    historyRepo = {
      findById: jest.fn(),
      findByPatientId: jest.fn().mockResolvedValue(mockHistory),
      save: jest.fn(),
    };
    odontogramRepo = {
      findByPatientId: jest.fn().mockResolvedValue(mockOdontogram),
      save: jest.fn(),
    };
    attentionRepo = {
      findById: jest.fn(),
      findAllByPatientId: jest.fn().mockResolvedValue([mockAttention]),
      save: jest.fn(),
    };
    pdfGenerator = {
      generate: jest.fn().mockResolvedValue(Buffer.from('%PDF-1.4 mock content')),
    };
    clock = {
      now: jest.fn().mockReturnValue(fixedNow),
      todayInBogota: jest.fn().mockReturnValue('2026-10-16'),
      formatInBogota: jest.fn().mockImplementation((d: Date) => d.toISOString().slice(0, 10)),
      isSameDayInBogota: jest.fn().mockReturnValue(true),
    };

    query = new ExportClinicalHistoryPdfQuery(
      clinicRepo,
      patientRepo,
      historyRepo,
      odontogramRepo,
      attentionRepo,
      pdfGenerator,
      clock,
    );
  });

  it('debe generar el PDF de la historia clínica completa con membrete, odontograma y atenciones excluyendo siempre privateNotes', async () => {
    let capturedDocumentData: ClinicalHistoryPdfDocumentData | undefined;
    pdfGenerator.generate.mockImplementation(async (data) => {
      capturedDocumentData = data;
      return Buffer.from('%PDF-1.4 test');
    });

    const result = await query.execute({ clinicId, patientId });

    expect(result.contentType).toBe('application/pdf');
    expect(result.filename).toBe(`historia-clinica-${patientId}.pdf`);
    expect(result.buffer).toEqual(Buffer.from('%PDF-1.4 test'));

    expect(capturedDocumentData).toBeDefined();
    const data = capturedDocumentData as ClinicalHistoryPdfDocumentData;
    // Verificamos que se pasaron los datos del consultorio y paciente
    expect(data.clinic.name).toBe('Consultorio Dra. Angelee Pacheco');
    expect(data.patient.fullName).toBe('Juan Pérez');
    expect(data.patient.age).toBe(36);

    // Verificamos historia clínica y antecedentes
    expect(data.history.chiefComplaint).toBe('Dolor severo en molar inferior derecho');
    expect(data.history.medicalAntecedents.hypertension).toBe(true);
    expect(data.history.treatmentItems).toHaveLength(1);

    // Verificamos odontograma
    expect(data.odontogram!.teeth['46']).toHaveLength(1);

    // Verificamos atenciones y la EXCLUSIÓN ESTRICTA de privateNotes (RF-B-027, RC-023)
    expect(data.attentions).toHaveLength(1);
    const attentionItem = data.attentions[0];
    expect(attentionItem.evolutionNotes).toBe('Obturación oclusal en diente 16');
    expect(attentionItem.prescription).toBe('Ibuprofeno 600mg cada 8 horas por 3 días');
    expect(attentionItem.materialsUsed).toHaveLength(1);
    expect((attentionItem as unknown as Record<string, unknown>).privateNotes).toBeUndefined();

    // Verificamos que toda la estructura de datos no contenga "Nota confidencial secreta de la doctora"
    const serializedData = JSON.stringify(data);
    expect(serializedData).not.toContain('Nota confidencial secreta de la doctora');
  });

  it('debe lanzar ClinicalHistoryNotFoundError (404) cuando se intenta exportar el PDF de un paciente sin historia clínica', async () => {
    historyRepo.findByPatientId.mockResolvedValue(null);

    await expect(query.execute({ clinicId, patientId })).rejects.toThrow(
      ClinicalHistoryNotFoundError,
    );
  });

  it('debe lanzar ClinicNotFoundError si el consultorio no existe', async () => {
    clinicRepo.findById.mockResolvedValue(null);

    await expect(query.execute({ clinicId: 'inexistente', patientId })).rejects.toThrow(
      ClinicNotFoundError,
    );
  });

  it('debe lanzar PatientNotFoundError si el paciente no existe', async () => {
    patientRepo.findById.mockResolvedValue(null);

    await expect(query.execute({ clinicId, patientId: 'inexistente' })).rejects.toThrow(
      PatientNotFoundError,
    );
  });

  it('debe generar el PDF correctamente cuando el paciente no tiene odontograma ni atenciones registradas', async () => {
    odontogramRepo.findByPatientId.mockResolvedValue(null);
    attentionRepo.findAllByPatientId.mockResolvedValue([]);

    let capturedData: ClinicalHistoryPdfDocumentData | undefined;
    pdfGenerator.generate.mockImplementation(async (data) => {
      capturedData = data;
      return Buffer.from('%PDF-1.4 empty-cases');
    });

    const result = await query.execute({ clinicId, patientId });

    expect(result.contentType).toBe('application/pdf');
    expect(capturedData!.odontogram).toBeNull();
    expect(capturedData!.attentions).toEqual([]);
  });
});
