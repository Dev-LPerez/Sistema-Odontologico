import { DetectDuplicatePatientsQuery } from './detect-duplicate-patients.query';
import { PatientRepositoryPort } from '../../domain/patient.repository.port';
import { DocumentType } from '../../domain/document-type.enum';
import { AcquisitionSource } from '../../domain/acquisition-source.enum';
import { Patient } from '../../domain/patient.entity';
import { DocumentIdentity } from '../../domain/document-identity.vo';
import { PhoneNumber } from '../../domain/phone-number.vo';

describe('DetectDuplicatePatientsQuery', () => {
  let query: DetectDuplicatePatientsQuery;
  let mockPatientRepo: jest.Mocked<PatientRepositoryPort>;

  const fixedNow = new Date('2026-10-14T10:00:00.000Z');

  beforeEach(() => {
    mockPatientRepo = {
      findById: jest.fn(),
      findByDocument: jest.fn(),
      findPotentialDuplicates: jest.fn(),
      findAllByClinicId: jest.fn(),
      save: jest.fn(),
    };

    query = new DetectDuplicatePatientsQuery(mockPatientRepo);
  });

  it('debe retornar coincidencias por documento o teléfono normalizado dentro del mismo clinicId indicando el motivo', async () => {
    const patientDocMatch = Patient.create({
      id: 'patient-1',
      clinicId: 'clinic-123',
      firstName: 'Carlos',
      lastName: 'Gómez',
      document: DocumentIdentity.create(DocumentType.CC, '1020304050'),
      birthDate: new Date('1990-05-15T00:00:00.000Z'),
      phone: PhoneNumber.create('3000000000'),
      acquisitionSource: AcquisitionSource.DIRECT,
      dataTreatmentConsent: true,
      dataTreatmentConsentAt: fixedNow,
      isActive: true,
      createdAt: fixedNow,
      updatedAt: fixedNow,
    });

    const patientPhoneMatch = Patient.create({
      id: 'patient-2',
      clinicId: 'clinic-123',
      firstName: 'Ana',
      lastName: 'Gómez',
      document: DocumentIdentity.create(DocumentType.TI, '9988776655'),
      birthDate: new Date('2010-01-01T00:00:00.000Z'),
      phone: PhoneNumber.create('3001234567'),
      acquisitionSource: AcquisitionSource.DIRECT,
      dataTreatmentConsent: true,
      dataTreatmentConsentAt: fixedNow,
      isActive: true,
      createdAt: fixedNow,
      updatedAt: fixedNow,
    });

    mockPatientRepo.findPotentialDuplicates.mockResolvedValue([patientDocMatch, patientPhoneMatch]);

    const result = await query.execute({
      clinicId: 'clinic-123',
      documentNumber: '1020304050',
      phone: '300-123-4567',
    });

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('patient-1');
    expect(result[0].matchReason).toBe('DOCUMENT');
    expect(result[1].id).toBe('patient-2');
    expect(result[1].matchReason).toBe('PHONE');

    expect(mockPatientRepo.findPotentialDuplicates).toHaveBeenCalledWith('clinic-123', {
      documentNumber: '1020304050',
      phone: '3001234567',
      excludePatientId: undefined,
    });
  });

  it('debe retornar un array vacío sin consultar el repositorio si no se pasa ni documento ni teléfono', async () => {
    const result = await query.execute({
      clinicId: 'clinic-123',
    });

    expect(result).toEqual([]);
    expect(mockPatientRepo.findPotentialDuplicates).not.toHaveBeenCalled();
  });

  it('debe retornar matchReason BOTH si coinciden tanto documento como teléfono', async () => {
    const patientBothMatch = Patient.create({
      id: 'patient-both',
      clinicId: 'clinic-123',
      firstName: 'Lucía',
      lastName: 'Fernández',
      document: DocumentIdentity.create(DocumentType.CC, '55443322'),
      birthDate: new Date('1992-03-10T00:00:00.000Z'),
      phone: PhoneNumber.create('3112223344'),
      acquisitionSource: AcquisitionSource.DIRECT,
      dataTreatmentConsent: true,
      dataTreatmentConsentAt: fixedNow,
      isActive: true,
      createdAt: fixedNow,
      updatedAt: fixedNow,
    });

    mockPatientRepo.findPotentialDuplicates.mockResolvedValue([patientBothMatch]);

    const result = await query.execute({
      clinicId: 'clinic-123',
      documentNumber: '55443322',
      phone: '3112223344',
    });

    expect(result).toHaveLength(1);
    expect(result[0].matchReason).toBe('BOTH');
  });
});
