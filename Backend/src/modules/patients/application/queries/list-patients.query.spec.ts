import { ListPatientsQuery } from './list-patients.query';
import { PatientRepositoryPort } from '../../domain/patient.repository.port';
import { DocumentType } from '../../domain/document-type.enum';
import { AcquisitionSource } from '../../domain/acquisition-source.enum';
import { Patient } from '../../domain/patient.entity';
import { DocumentIdentity } from '../../domain/document-identity.vo';
import { PhoneNumber } from '../../domain/phone-number.vo';

describe('ListPatientsQuery', () => {
  let query: ListPatientsQuery;
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

    query = new ListPatientsQuery(mockPatientRepo);
  });

  it('debe listar los pacientes de la clínica aplicando el filtro de estado si se especifica', async () => {
    const patient1 = Patient.create({
      id: 'patient-1',
      clinicId: 'clinic-123',
      firstName: 'Carlos',
      lastName: 'Gómez',
      document: DocumentIdentity.create(DocumentType.CC, '1020304050'),
      birthDate: new Date('1990-05-15T00:00:00.000Z'),
      phone: PhoneNumber.create('3001234567'),
      acquisitionSource: AcquisitionSource.DIRECT,
      dataTreatmentConsent: true,
      dataTreatmentConsentAt: fixedNow,
      isActive: true,
      createdAt: fixedNow,
      updatedAt: fixedNow,
    });

    mockPatientRepo.findAllByClinicId.mockResolvedValue([patient1]);

    const result = await query.execute({
      clinicId: 'clinic-123',
      isActive: true,
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('patient-1');
    expect(mockPatientRepo.findAllByClinicId).toHaveBeenCalledWith('clinic-123', {
      isActive: true,
    });
  });

  it('debe listar los pacientes sin filtro si isActive es undefined', async () => {
    mockPatientRepo.findAllByClinicId.mockResolvedValue([]);

    const result = await query.execute({
      clinicId: 'clinic-123',
    });

    expect(result).toEqual([]);
    expect(mockPatientRepo.findAllByClinicId).toHaveBeenCalledWith('clinic-123', undefined);
  });
});
