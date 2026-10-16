import { CreateOdontogramSnapshotUseCase } from './create-odontogram-snapshot.use-case';
import { OdontogramRepositoryPort } from '../../domain/odontogram.repository.port';
import { OdontogramSnapshotRepositoryPort } from '../../domain/odontogram-snapshot.repository.port';
import { PatientRepositoryPort, PatientNotFoundError, Patient } from '../../../patients';
import { ClockPort } from '../../../../shared/application/ports/clock.port';
import { IdGeneratorPort } from '../../../../shared/application/ports/id-generator.port';
import { Odontogram } from '../../domain/odontogram.entity';
import { ToothFinding } from '../../domain/tooth-finding.vo';
import { ToothNumber } from '../../domain/tooth-number.vo';
import { ToothSurface } from '../../domain/tooth-surface.enum';
import { FindingCatalogCode } from '../../domain/finding-catalog.enum';
import { FindingStatus } from '../../domain/finding-status.enum';
import { OdontogramNotFoundError } from '../../domain/clinical.errors';

describe('CreateOdontogramSnapshotUseCase', () => {
  let useCase: CreateOdontogramSnapshotUseCase;
  let odontogramRepo: jest.Mocked<OdontogramRepositoryPort>;
  let snapshotRepo: jest.Mocked<OdontogramSnapshotRepositoryPort>;
  let patientRepo: jest.Mocked<PatientRepositoryPort>;
  let clock: jest.Mocked<ClockPort>;
  let idGen: jest.Mocked<IdGeneratorPort>;

  const fixedDate = new Date('2026-10-15T12:00:00.000Z');

  beforeEach(() => {
    odontogramRepo = {
      findByPatientId: jest.fn(),
      save: jest.fn(),
    };
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
    clock = {
      now: jest.fn().mockReturnValue(fixedDate),
      todayInBogota: jest.fn().mockReturnValue('2026-10-15'),
      formatInBogota: jest.fn().mockReturnValue('2026-10-15T12:00:00-05:00'),
      isSameDayInBogota: jest.fn().mockReturnValue(true),
    };
    idGen = {
      generate: jest.fn().mockReturnValue('snap-gen-123'),
    };

    useCase = new CreateOdontogramSnapshotUseCase(
      odontogramRepo,
      snapshotRepo,
      patientRepo,
      clock,
      idGen,
    );
  });

  it('debe crear una instantánea inmutable del odontograma y conservar su estado histórico aunque el odontograma cambie después', async () => {
    patientRepo.findById.mockResolvedValue({
      id: 'patient-123',
      clinicId: 'clinic-123',
    } as unknown as Patient);

    const finding16 = ToothFinding.create({
      toothNumber: ToothNumber.of(16),
      surface: ToothSurface.OCCLUSAL,
      findingCode: FindingCatalogCode.CARIES,
      status: FindingStatus.EXISTING,
      createdAt: fixedDate,
    });

    const activeOdontogram = Odontogram.create({
      id: 'odon-123',
      clinicId: 'clinic-123',
      patientId: 'patient-123',
      hasTemporalDentition: false,
      findings: [finding16],
      createdAt: fixedDate,
      updatedAt: fixedDate,
    });

    odontogramRepo.findByPatientId.mockResolvedValue(activeOdontogram);

    const snapshot = await useCase.execute({
      clinicId: 'clinic-123',
      patientId: 'patient-123',
      notes: 'Estado pre-tratamiento',
    });

    expect(snapshot.id).toBe('snap-gen-123');
    expect(snapshot.clinicId).toBe('clinic-123');
    expect(snapshot.patientId).toBe('patient-123');
    expect(snapshot.odontogramId).toBe('odon-123');
    expect(snapshot.notes).toBe('Estado pre-tratamiento');
    expect(snapshotRepo.save).toHaveBeenCalledTimes(1);

    // Verificamos que aunque el odontograma activo sea modificado, la instantánea retiene el estado previo
    const newFinding = ToothFinding.create({
      toothNumber: ToothNumber.of(16),
      surface: ToothSurface.OCCLUSAL,
      findingCode: FindingCatalogCode.RESIN_RESTORATION,
      status: FindingStatus.PERFORMED,
      createdAt: new Date('2026-10-15T15:00:00.000Z'),
    });
    activeOdontogram.updateFindings([newFinding], false, new Date('2026-10-15T15:00:00.000Z'));

    const snapshotTeeth = (
      snapshot.snapshotData as { teeth: Record<string, Array<{ findingCode: string }>> }
    ).teeth;
    expect(snapshotTeeth['16'][0].findingCode).toBe('CARIES');
  });

  it('debe rechazar con PatientNotFoundError cuando el paciente no existe', async () => {
    patientRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        clinicId: 'clinic-123',
        patientId: 'patient-999',
      }),
    ).rejects.toThrow(PatientNotFoundError);
  });

  it('debe rechazar con OdontogramNotFoundError cuando el paciente no tiene un odontograma registrado', async () => {
    patientRepo.findById.mockResolvedValue({
      id: 'patient-123',
      clinicId: 'clinic-123',
    } as unknown as Patient);
    odontogramRepo.findByPatientId.mockResolvedValue(null);

    await expect(
      useCase.execute({
        clinicId: 'clinic-123',
        patientId: 'patient-123',
      }),
    ).rejects.toThrow(OdontogramNotFoundError);
  });
});
