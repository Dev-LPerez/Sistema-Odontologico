import { GetPatientByIdQuery } from './get-patient-by-id.query';
import { PatientRepositoryPort } from '../../domain/patient.repository.port';
import { DocumentType } from '../../domain/document-type.enum';
import { AcquisitionSource } from '../../domain/acquisition-source.enum';
import { Patient } from '../../domain/patient.entity';
import { DocumentIdentity } from '../../domain/document-identity.vo';
import { PhoneNumber } from '../../domain/phone-number.vo';
import { PatientNotFoundError } from '../../domain/patients.errors';

describe('GetPatientByIdQuery', () => {
  let query: GetPatientByIdQuery;
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

    query = new GetPatientByIdQuery(mockPatientRepo);
  });

  it('debe retornar el detalle del paciente cuando existe en la clínica', async () => {
    const patient = Patient.create({
      id: 'patient-123',
      clinicId: 'clinic-123',
      firstName: 'Carlos',
      lastName: 'Gómez',
      document: DocumentIdentity.create(DocumentType.CC, '1020304050'),
      birthDate: new Date('1990-05-15T00:00:00.000Z'),
      phone: PhoneNumber.create('3001234567'),
      email: 'carlos@example.com',
      acquisitionSource: AcquisitionSource.DIRECT,
      dataTreatmentConsent: true,
      dataTreatmentConsentAt: fixedNow,
      isActive: true,
      createdAt: fixedNow,
      updatedAt: fixedNow,
    });
    mockPatientRepo.findById.mockResolvedValue(patient);

    const result = await query.execute({
      clinicId: 'clinic-123',
      patientId: 'patient-123',
    });

    expect(result.id).toBe('patient-123');
    expect(result.firstName).toBe('Carlos');
    expect(result.documentNumber).toBe('1020304050');
    expect(mockPatientRepo.findById).toHaveBeenCalledWith('clinic-123', 'patient-123');
  });

  it('debe lanzar PatientNotFoundError si el paciente no existe', async () => {
    mockPatientRepo.findById.mockResolvedValue(null);

    await expect(
      query.execute({
        clinicId: 'clinic-123',
        patientId: 'patient-999',
      }),
    ).rejects.toThrow(PatientNotFoundError);
  });
});
