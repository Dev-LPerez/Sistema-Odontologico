import { OdontogramController } from './odontogram.controller';
import { UpsertPatientOdontogramUseCase } from '../application/use-cases/upsert-patient-odontogram.use-case';
import { CreateOdontogramSnapshotUseCase } from '../application/use-cases/create-odontogram-snapshot.use-case';
import { GetOdontogramByPatientQuery } from '../application/queries/get-odontogram-by-patient.query';
import { ListOdontogramSnapshotsQuery } from '../application/queries/list-odontogram-snapshots.query';
import { Odontogram } from '../domain/odontogram.entity';
import { OdontogramSnapshot } from '../domain/odontogram-snapshot.entity';
import { ToothFinding } from '../domain/tooth-finding.vo';
import { ToothNumber } from '../domain/tooth-number.vo';
import { ToothSurface } from '../domain/tooth-surface.enum';
import { FindingCatalogCode } from '../domain/finding-catalog.enum';
import { FindingStatus } from '../domain/finding-status.enum';
import { UserRole } from '../../identity';
import { AuthenticatedUserPayload } from '../../../shared/presentation/decorators';

describe('OdontogramController Unit Tests', () => {
  let controller: OdontogramController;
  let upsertUseCase: jest.Mocked<UpsertPatientOdontogramUseCase>;
  let createSnapshotUseCase: jest.Mocked<CreateOdontogramSnapshotUseCase>;
  let getOdontogramQuery: jest.Mocked<GetOdontogramByPatientQuery>;
  let listSnapshotsQuery: jest.Mocked<ListOdontogramSnapshotsQuery>;

  const mockAdminUser: AuthenticatedUserPayload = {
    sub: 'user-admin-1',
    clinicId: 'clinic-123',
    email: 'dra.angelee@example.com',
    role: UserRole.ADMIN,
  };

  const fixedDate = new Date('2026-10-15T10:00:00.000Z');

  const sampleFinding = ToothFinding.create({
    toothNumber: ToothNumber.of(16),
    surface: ToothSurface.OCCLUSAL,
    findingCode: FindingCatalogCode.CARIES,
    status: FindingStatus.EXISTING,
    notes: 'Fosa oclusal',
    createdAt: fixedDate,
  });

  const sampleOdontogram = Odontogram.create({
    id: 'odon-123',
    clinicId: 'clinic-123',
    patientId: 'patient-456',
    hasTemporalDentition: false,
    findings: [sampleFinding],
    createdAt: fixedDate,
    updatedAt: fixedDate,
  });

  const sampleSnapshot = OdontogramSnapshot.create({
    id: 'snap-123',
    clinicId: 'clinic-123',
    patientId: 'patient-456',
    odontogramId: 'odon-123',
    hasTemporalDentition: false,
    snapshotData: { teeth: {} },
    notes: 'Instantánea de prueba',
    createdAt: fixedDate,
  });

  beforeEach(() => {
    upsertUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<UpsertPatientOdontogramUseCase>;

    createSnapshotUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CreateOdontogramSnapshotUseCase>;

    getOdontogramQuery = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetOdontogramByPatientQuery>;

    listSnapshotsQuery = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<ListOdontogramSnapshotsQuery>;

    controller = new OdontogramController(
      upsertUseCase,
      createSnapshotUseCase,
      getOdontogramQuery,
      listSnapshotsQuery,
    );
  });

  it('debe registrar o actualizar el odontograma delegando en UpsertPatientOdontogramUseCase', async () => {
    upsertUseCase.execute.mockResolvedValue(sampleOdontogram);

    const dto = {
      hasTemporalDentition: false,
      findings: [
        {
          toothNumber: 16,
          surface: ToothSurface.OCCLUSAL,
          findingCode: FindingCatalogCode.CARIES,
          status: FindingStatus.EXISTING,
          notes: 'Fosa oclusal',
        },
      ],
    };

    const response = await controller.upsert(mockAdminUser, 'patient-456', dto);

    expect(response.id).toBe('odon-123');
    expect(response.clinicId).toBe('clinic-123');
    expect(response.patientId).toBe('patient-456');
    expect(response.findings).toHaveLength(1);
    expect(upsertUseCase.execute).toHaveBeenCalledWith({
      clinicId: 'clinic-123',
      patientId: 'patient-456',
      hasTemporalDentition: false,
      findings: dto.findings,
    });
  });

  it('debe consultar el odontograma delegando en GetOdontogramByPatientQuery', async () => {
    getOdontogramQuery.execute.mockResolvedValue(sampleOdontogram);

    const response = await controller.getByPatient(mockAdminUser, 'patient-456');

    expect(response.id).toBe('odon-123');
    expect(response.findings).toHaveLength(1);
    expect(getOdontogramQuery.execute).toHaveBeenCalledWith({
      clinicId: 'clinic-123',
      patientId: 'patient-456',
    });
  });

  it('debe crear una instantánea delegando en CreateOdontogramSnapshotUseCase', async () => {
    createSnapshotUseCase.execute.mockResolvedValue(sampleSnapshot);

    const dto = { notes: 'Instantánea de prueba' };
    const response = await controller.createSnapshot(mockAdminUser, 'patient-456', dto);

    expect(response.id).toBe('snap-123');
    expect(response.notes).toBe('Instantánea de prueba');
    expect(createSnapshotUseCase.execute).toHaveBeenCalledWith({
      clinicId: 'clinic-123',
      patientId: 'patient-456',
      notes: 'Instantánea de prueba',
    });
  });

  it('debe listar instantáneas delegando en ListOdontogramSnapshotsQuery', async () => {
    listSnapshotsQuery.execute.mockResolvedValue([sampleSnapshot]);

    const response = await controller.listSnapshots(mockAdminUser, 'patient-456');

    expect(response).toHaveLength(1);
    expect(response[0].id).toBe('snap-123');
    expect(listSnapshotsQuery.execute).toHaveBeenCalledWith({
      clinicId: 'clinic-123',
      patientId: 'patient-456',
    });
  });
});
