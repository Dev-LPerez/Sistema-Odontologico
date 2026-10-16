import { GetOdontogramByPatientQuery } from './get-odontogram-by-patient.query';
import { OdontogramRepositoryPort } from '../../domain/odontogram.repository.port';
import { OdontogramNotFoundError } from '../../domain/clinical.errors';
import { Odontogram } from '../../domain/odontogram.entity';

describe('GetOdontogramByPatientQuery', () => {
  let query: GetOdontogramByPatientQuery;
  let odontogramRepo: jest.Mocked<OdontogramRepositoryPort>;

  beforeEach(() => {
    odontogramRepo = {
      findByPatientId: jest.fn(),
      save: jest.fn(),
    };

    query = new GetOdontogramByPatientQuery(odontogramRepo);
  });

  it('debe retornar el odontograma del paciente si existe para la clínica dada', async () => {
    const mockOdontogram = Odontogram.create({
      id: 'odon-123',
      clinicId: 'clinic-123',
      patientId: 'patient-456',
      hasTemporalDentition: false,
      findings: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    odontogramRepo.findByPatientId.mockResolvedValue(mockOdontogram);

    const result = await query.execute({
      clinicId: 'clinic-123',
      patientId: 'patient-456',
    });

    expect(result).toBe(mockOdontogram);
    expect(odontogramRepo.findByPatientId).toHaveBeenCalledWith('clinic-123', 'patient-456');
  });

  it('debe lanzar OdontogramNotFoundError cuando no existe odontograma para el paciente', async () => {
    odontogramRepo.findByPatientId.mockResolvedValue(null);

    await expect(
      query.execute({
        clinicId: 'clinic-123',
        patientId: 'patient-unknown',
      }),
    ).rejects.toThrow(OdontogramNotFoundError);
  });
});
