import { UpdatePatientUseCase } from './update-patient.use-case';
import { PatientRepositoryPort } from '../../domain/patient.repository.port';
import { DocumentType } from '../../domain/document-type.enum';
import { AcquisitionSource } from '../../domain/acquisition-source.enum';
import { Patient } from '../../domain/patient.entity';
import { DocumentIdentity } from '../../domain/document-identity.vo';
import { PhoneNumber } from '../../domain/phone-number.vo';
import { EmergencyContact } from '../../domain/emergency-contact.vo';
import { PatientNotFoundError } from '../../domain/patients.errors';
import { ClockPort } from '../../../../shared/application/ports/clock.port';

describe('UpdatePatientUseCase', () => {
  let useCase: UpdatePatientUseCase;
  let mockPatientRepo: jest.Mocked<PatientRepositoryPort>;
  let mockClock: jest.Mocked<ClockPort>;

  const fixedNow = new Date('2026-10-14T10:00:00.000Z');
  const updateTime = new Date('2026-10-14T11:00:00.000Z');

  const createExistingPatient = () =>
    Patient.create({
      id: 'patient-123',
      clinicId: 'clinic-123',
      firstName: 'Carlos',
      lastName: 'Gómez',
      document: DocumentIdentity.create(DocumentType.CC, '1020304050'),
      birthDate: new Date('1990-05-15T00:00:00.000Z'),
      phone: PhoneNumber.create('3001234567'),
      email: 'carlos@example.com',
      address: 'Calle 100 # 15-20',
      emergencyContact: EmergencyContact.create('María Gómez', PhoneNumber.create('3109876543')),
      acquisitionSource: AcquisitionSource.DIRECT,
      dataTreatmentConsent: true,
      dataTreatmentConsentAt: fixedNow,
      isActive: true,
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
      now: jest.fn().mockReturnValue(updateTime),
      todayInBogota: jest.fn().mockReturnValue('2026-10-14'),
      formatInBogota: jest.fn().mockReturnValue('2026-10-14 06:00:00'),
      isSameDayInBogota: jest.fn().mockReturnValue(true),
    };

    useCase = new UpdatePatientUseCase(mockPatientRepo, mockClock);
  });

  it('debe actualizar los datos demográficos, contacto de emergencia y fuente de captación del paciente', async () => {
    const existing = createExistingPatient();
    mockPatientRepo.findById.mockResolvedValue(existing);

    const result = await useCase.execute({
      clinicId: 'clinic-123',
      patientId: 'patient-123',
      firstName: 'Carlos Alberto',
      lastName: 'Gómez Pérez',
      phone: '3009998877',
      email: 'carlos.alberto@example.com',
      address: 'Carrera 7 # 120-10',
      emergencyContactName: 'Pedro Gómez',
      emergencyContactPhone: '3201112233',
      acquisitionSource: AcquisitionSource.INSTAGRAM,
    });

    expect(result.id).toBe('patient-123');
    expect(result.firstName).toBe('Carlos Alberto');
    expect(result.lastName).toBe('Gómez Pérez');
    expect(result.phone).toBe('3009998877');
    expect(result.email).toBe('carlos.alberto@example.com');
    expect(result.address).toBe('Carrera 7 # 120-10');
    expect(result.emergencyContactName).toBe('Pedro Gómez');
    expect(result.emergencyContactPhone).toBe('3201112233');
    expect(result.acquisitionSource).toBe(AcquisitionSource.INSTAGRAM);
    expect(result.updatedAt).toEqual(updateTime);

    expect(mockPatientRepo.save).toHaveBeenCalledWith(existing);
  });

  it('debe permitir eliminar el contacto de emergencia si se envía null', async () => {
    const existing = createExistingPatient();
    mockPatientRepo.findById.mockResolvedValue(existing);

    const result = await useCase.execute({
      clinicId: 'clinic-123',
      patientId: 'patient-123',
      emergencyContactName: null,
    });

    expect(result.emergencyContactName).toBeNull();
    expect(result.emergencyContactPhone).toBeNull();
    expect(existing.emergencyContact).toBeNull();
  });

  it('debe mantener intacto el contacto de emergencia si los campos son undefined o sólo se envía el nombre', async () => {
    const existing = createExistingPatient();
    mockPatientRepo.findById.mockResolvedValue(existing);

    const result = await useCase.execute({
      clinicId: 'clinic-123',
      patientId: 'patient-123',
      firstName: 'Nuevo Nombre',
      emergencyContactName: 'Solo Nombre Sin Telefono',
    });

    expect(result.firstName).toBe('Nuevo Nombre');
    expect(result.emergencyContactName).toBe('María Gómez');
    expect(result.emergencyContactPhone).toBe('3109876543');
  });

  it('debe lanzar PatientNotFoundError si el paciente no existe en el consultorio', async () => {
    mockPatientRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        clinicId: 'clinic-123',
        patientId: 'non-existing',
        firstName: 'Otro',
      }),
    ).rejects.toThrow(PatientNotFoundError);

    expect(mockPatientRepo.save).not.toHaveBeenCalled();
  });
});
