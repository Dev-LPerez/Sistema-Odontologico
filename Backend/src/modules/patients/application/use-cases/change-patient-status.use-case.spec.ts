import { ChangePatientStatusUseCase } from './change-patient-status.use-case';
import { PatientRepositoryPort } from '../../domain/patient.repository.port';
import { DocumentType } from '../../domain/document-type.enum';
import { AcquisitionSource } from '../../domain/acquisition-source.enum';
import { Patient } from '../../domain/patient.entity';
import { DocumentIdentity } from '../../domain/document-identity.vo';
import { PhoneNumber } from '../../domain/phone-number.vo';
import { PatientNotFoundError } from '../../domain/patients.errors';
import { ClockPort } from '../../../../shared/application/ports/clock.port';

describe('ChangePatientStatusUseCase', () => {
  let useCase: ChangePatientStatusUseCase;
  let mockPatientRepo: jest.Mocked<PatientRepositoryPort>;
  let mockClock: jest.Mocked<ClockPort>;

  const fixedNow = new Date('2026-10-14T10:00:00.000Z');
  const changeTime = new Date('2026-10-14T12:00:00.000Z');

  const createPatient = (isActive = true) =>
    Patient.create({
      id: 'patient-123',
      clinicId: 'clinic-123',
      firstName: 'Carlos',
      lastName: 'Gómez',
      document: DocumentIdentity.create(DocumentType.CC, '1020304050'),
      birthDate: new Date('1990-05-15T00:00:00.000Z'),
      phone: PhoneNumber.create('3001234567'),
      acquisitionSource: AcquisitionSource.DIRECT,
      dataTreatmentConsent: true,
      dataTreatmentConsentAt: fixedNow,
      isActive,
      createdAt: fixedNow,
      updatedAt: fixedNow,
    });

  beforeEach(() => {
    mockPatientRepo = {
      findById: jest.fn(),
      findByDocument: jest.fn(),
      findPotentialDuplicates: jest.fn(),
      findAllByClinicId: jest.fn(),
      save: jest.fn(),
    };

    mockClock = {
      now: jest.fn().mockReturnValue(changeTime),
      todayInBogota: jest.fn().mockReturnValue('2026-10-14'),
      formatInBogota: jest.fn().mockReturnValue('2026-10-14 07:00:00'),
      isSameDayInBogota: jest.fn().mockReturnValue(true),
    };

    useCase = new ChangePatientStatusUseCase(mockPatientRepo, mockClock);
  });

  it('debe desactivar lógicamente al paciente cambiando isActive a false sin eliminarlo', async () => {
    const patient = createPatient(true);
    mockPatientRepo.findById.mockResolvedValue(patient);

    const result = await useCase.execute({
      clinicId: 'clinic-123',
      patientId: 'patient-123',
      isActive: false,
    });

    expect(result.id).toBe('patient-123');
    expect(result.isActive).toBe(false);
    expect(result.updatedAt).toEqual(changeTime);
    expect(patient.isActive).toBe(false);

    expect(mockPatientRepo.save).toHaveBeenCalledWith(patient);
  });

  it('debe lanzar PatientNotFoundError si el paciente no existe', async () => {
    mockPatientRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        clinicId: 'clinic-123',
        patientId: 'patient-unknown',
        isActive: false,
      }),
    ).rejects.toThrow(PatientNotFoundError);

    expect(mockPatientRepo.save).not.toHaveBeenCalled();
  });
});
