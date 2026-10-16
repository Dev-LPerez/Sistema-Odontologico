import { ListOdontogramSnapshotsQuery } from './list-odontogram-snapshots.query';
import { OdontogramSnapshotRepositoryPort } from '../../domain/odontogram-snapshot.repository.port';
import { PatientRepositoryPort, PatientNotFoundError, Patient } from '../../../patients';
import { OdontogramSnapshot } from '../../domain/odontogram-snapshot.entity';

describe('ListOdontogramSnapshotsQuery', () => {
  let query: ListOdontogramSnapshotsQuery;
  let snapshotRepo: jest.Mocked<OdontogramSnapshotRepositoryPort>;
  let patientRepo: jest.Mocked<PatientRepositoryPort>;

  beforeEach(() => {
    snapshotRepo = {
      findAllByPatientId: jest.fn(),
      save: jest.fn(),
    };
    patientRepo = {
      findById: jest.fn(),
      findByDocument: jest.fn(),
      findPotentialDuplicates: jest.fn(),
      findAllByClinicId: jest.fn(),
      save: jest.fn(),
    };

    query = new ListOdontogramSnapshotsQuery(snapshotRepo, patientRepo);
  });

  it('debe listar todas las instantáneas del paciente ordenadas por fecha si el paciente existe', async () => {
    patientRepo.findById.mockResolvedValue({
      id: 'patient-123',
      clinicId: 'clinic-123',
    } as unknown as Patient);

    const mockSnapshots = [
      OdontogramSnapshot.create({
        id: 'snap-1',
        clinicId: 'clinic-123',
        patientId: 'patient-123',
        odontogramId: 'odon-1',
        hasTemporalDentition: false,
        snapshotData: { teeth: {} },
        createdAt: new Date('2026-10-15T10:00:00.000Z'),
      }),
      OdontogramSnapshot.create({
        id: 'snap-2',
        clinicId: 'clinic-123',
        patientId: 'patient-123',
        odontogramId: 'odon-1',
        hasTemporalDentition: false,
        snapshotData: { teeth: {} },
        createdAt: new Date('2026-10-15T12:00:00.000Z'),
      }),
    ];

    snapshotRepo.findAllByPatientId.mockResolvedValue(mockSnapshots);

    const result = await query.execute({
      clinicId: 'clinic-123',
      patientId: 'patient-123',
    });

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('snap-1');
    expect(result[1].id).toBe('snap-2');
    expect(snapshotRepo.findAllByPatientId).toHaveBeenCalledWith('clinic-123', 'patient-123');
  });

  it('debe lanzar PatientNotFoundError cuando el paciente no existe en el consultorio', async () => {
    patientRepo.findById.mockResolvedValue(null);

    await expect(
      query.execute({
        clinicId: 'clinic-123',
        patientId: 'patient-unknown',
      }),
    ).rejects.toThrow(PatientNotFoundError);
  });
});
