import { CreatePatientUseCase } from './create-patient.use-case';
import { PatientRepositoryPort } from '../../domain/patient.repository.port';
import { DocumentType } from '../../domain/document-type.enum';
import { AcquisitionSource } from '../../domain/acquisition-source.enum';
import { Patient } from '../../domain/patient.entity';
import {
  DataTreatmentConsentRequiredError,
  DuplicatePatientDocumentError,
} from '../../domain/patients.errors';
import { ClockPort } from '../../../../shared/application/ports/clock.port';
import { IdGeneratorPort } from '../../../../shared/application/ports/id-generator.port';

describe('CreatePatientUseCase', () => {
  let useCase: CreatePatientUseCase;
  let mockPatientRepo: jest.Mocked<PatientRepositoryPort>;
  let mockClock: jest.Mocked<ClockPort>;
  let mockIdGenerator: jest.Mocked<IdGeneratorPort>;

  const fixedNow = new Date('2026-10-14T10:00:00.000Z');

  beforeEach(() => {
    mockPatientRepo = {
      findById: jest.fn(),
      findByDocument: jest.fn(),
      findPotentialDuplicates: jest.fn(),
      findAllByClinicId: jest.fn(),
      save: jest.fn(),
    };

    mockClock = {
      now: jest.fn().mockReturnValue(fixedNow),
      todayInBogota: jest.fn().mockReturnValue('2026-10-14'),
      formatInBogota: jest.fn().mockReturnValue('2026-10-14 05:00:00'),
      isSameDayInBogota: jest.fn().mockReturnValue(true),
    };

    mockIdGenerator = {
      generate: jest.fn().mockReturnValue('patient-uuid-1'),
    };

    useCase = new CreatePatientUseCase(mockPatientRepo, mockClock, mockIdGenerator);
  });

  it('debe registrar un paciente activo con consentimiento Ley 1581 y asignar dataTreatmentConsentAt', async () => {
    mockPatientRepo.findByDocument.mockResolvedValue(null);

    const result = await useCase.execute({
      clinicId: 'clinic-123',
      firstName: 'Carlos',
      lastName: 'Gómez',
      documentType: DocumentType.CC,
      documentNumber: '1020304050',
      birthDate: '1990-05-15',
      phone: '3001234567',
      email: 'carlos@example.com',
      address: 'Calle 100 # 15-20',
      emergencyContactName: 'María Gómez',
      emergencyContactPhone: '3109876543',
      acquisitionSource: AcquisitionSource.INSTAGRAM,
      dataTreatmentConsent: true,
    });

    expect(result.id).toBe('patient-uuid-1');
    expect(result.clinicId).toBe('clinic-123');
    expect(result.firstName).toBe('Carlos');
    expect(result.lastName).toBe('Gómez');
    expect(result.documentType).toBe(DocumentType.CC);
    expect(result.documentNumber).toBe('1020304050');
    expect(result.phone).toBe('3001234567');
    expect(result.acquisitionSource).toBe(AcquisitionSource.INSTAGRAM);
    expect(result.dataTreatmentConsent).toBe(true);
    expect(result.dataTreatmentConsentAt).toEqual(fixedNow);
    expect(result.isActive).toBe(true);

    expect(mockPatientRepo.save).toHaveBeenCalledTimes(1);
    const savedPatient = mockPatientRepo.save.mock.calls[0][0];
    expect(savedPatient).toBeInstanceOf(Patient);
    expect(savedPatient.id).toBe('patient-uuid-1');
  });

  it('debe lanzar DataTreatmentConsentRequiredError cuando dataTreatmentConsent es false', async () => {
    await expect(
      useCase.execute({
        clinicId: 'clinic-123',
        firstName: 'Carlos',
        lastName: 'Gómez',
        documentType: DocumentType.CC,
        documentNumber: '1020304050',
        birthDate: '1990-05-15',
        phone: '3001234567',
        acquisitionSource: AcquisitionSource.DIRECT,
        dataTreatmentConsent: false,
      }),
    ).rejects.toThrow(DataTreatmentConsentRequiredError);

    expect(mockPatientRepo.save).not.toHaveBeenCalled();
  });

  it('debe lanzar DuplicatePatientDocumentError si ya existe un paciente con el mismo tipo y número de documento en el consultorio', async () => {
    mockPatientRepo.findByDocument.mockResolvedValue({} as Patient);

    await expect(
      useCase.execute({
        clinicId: 'clinic-123',
        firstName: 'Carlos',
        lastName: 'Gómez',
        documentType: DocumentType.CC,
        documentNumber: '1020304050',
        birthDate: '1990-05-15',
        phone: '3001234567',
        acquisitionSource: AcquisitionSource.DIRECT,
        dataTreatmentConsent: true,
      }),
    ).rejects.toThrow(DuplicatePatientDocumentError);

    expect(mockPatientRepo.save).not.toHaveBeenCalled();
  });
});
