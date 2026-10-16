import { UpsertPatientOdontogramUseCase } from './upsert-patient-odontogram.use-case';
import { OdontogramRepositoryPort } from '../../domain/odontogram.repository.port';
import { PatientRepositoryPort, PatientNotFoundError, Patient } from '../../../patients';
import { ClockPort } from '../../../../shared/application/ports/clock.port';
import { IdGeneratorPort } from '../../../../shared/application/ports/id-generator.port';
import { ToothSurface } from '../../domain/tooth-surface.enum';
import { FindingCatalogCode } from '../../domain/finding-catalog.enum';
import { FindingStatus } from '../../domain/finding-status.enum';
import { Odontogram } from '../../domain/odontogram.entity';
import { InvalidOdontogramDataError, OdontogramConflictError } from '../../domain/clinical.errors';

describe('UpsertPatientOdontogramUseCase', () => {
  let useCase: UpsertPatientOdontogramUseCase;
  let odontogramRepo: jest.Mocked<OdontogramRepositoryPort>;
  let patientRepo: jest.Mocked<PatientRepositoryPort>;
  let clock: jest.Mocked<ClockPort>;
  let idGen: jest.Mocked<IdGeneratorPort>;

  const fixedDate = new Date('2026-10-15T10:00:00.000Z');

  beforeEach(() => {
    odontogramRepo = {
      findByPatientId: jest.fn(),
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
      formatInBogota: jest.fn().mockReturnValue('2026-10-15T10:00:00-05:00'),
      isSameDayInBogota: jest.fn().mockReturnValue(true),
    };
    idGen = {
      generate: jest.fn().mockReturnValue('odon-gen-123'),
    };

    useCase = new UpsertPatientOdontogramUseCase(odontogramRepo, patientRepo, clock, idGen);
  });

  it('debe guardar, actualizar y consultar el odontograma estructurado con dientes permanentes y temporales aislando por clinicId', async () => {
    patientRepo.findById.mockResolvedValue({
      id: 'patient-123',
      clinicId: 'clinic-123',
    } as unknown as Patient);
    odontogramRepo.findByPatientId.mockResolvedValue(null);

    const command = {
      clinicId: 'clinic-123',
      patientId: 'patient-123',
      hasTemporalDentition: true,
      findings: [
        {
          toothNumber: 16,
          surface: ToothSurface.OCCLUSAL,
          findingCode: FindingCatalogCode.CARIES,
          status: FindingStatus.EXISTING,
          notes: 'Fosa oclusal profunda',
        },
        {
          toothNumber: 55,
          surface: ToothSurface.VESTIBULAR,
          findingCode: FindingCatalogCode.RESIN_RESTORATION,
          status: FindingStatus.PERFORMED,
          notes: 'Resina temporal clase V',
        },
      ],
    };

    const created = await useCase.execute(command);

    expect(created.id).toBe('odon-gen-123');
    expect(created.clinicId).toBe('clinic-123');
    expect(created.patientId).toBe('patient-123');
    expect(created.hasTemporalDentition).toBe(true);
    expect(created.findings).toHaveLength(2);
    expect(odontogramRepo.save).toHaveBeenCalledTimes(1);

    // Actualización de un odontograma existente
    odontogramRepo.findByPatientId.mockResolvedValue(created);
    const updatedDate = new Date('2026-10-15T11:00:00.000Z');
    clock.now.mockReturnValue(updatedDate);

    const updateCommand = {
      clinicId: 'clinic-123',
      patientId: 'patient-123',
      hasTemporalDentition: true,
      findings: [
        {
          toothNumber: 16,
          surface: ToothSurface.OCCLUSAL,
          findingCode: FindingCatalogCode.RESIN_RESTORATION,
          status: FindingStatus.PERFORMED,
        },
      ],
    };

    const updated = await useCase.execute(updateCommand);
    expect(updated.id).toBe('odon-gen-123');
    expect(updated.findings).toHaveLength(1);
    expect(updated.findings[0].findingCode).toBe(FindingCatalogCode.RESIN_RESTORATION);
    expect(updated.updatedAt).toEqual(updatedDate);
  });

  it('debe rechazar con PatientNotFoundError cuando el paciente no existe en el consultorio', async () => {
    patientRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        clinicId: 'clinic-123',
        patientId: 'non-existent-patient',
        findings: [],
      }),
    ).rejects.toThrow(PatientNotFoundError);
  });

  it('debe rechazar con InvalidOdontogramDataError si se envía un hallazgo temporal sin hasTemporalDentition activo', async () => {
    patientRepo.findById.mockResolvedValue({
      id: 'patient-123',
      clinicId: 'clinic-123',
    } as unknown as Patient);

    await expect(
      useCase.execute({
        clinicId: 'clinic-123',
        patientId: 'patient-123',
        hasTemporalDentition: false,
        findings: [
          {
            toothNumber: 55,
            surface: ToothSurface.VESTIBULAR,
            findingCode: FindingCatalogCode.CARIES,
            status: FindingStatus.EXISTING,
          },
        ],
      }),
    ).rejects.toThrow(InvalidOdontogramDataError);
  });

  it('debe lanzar OdontogramConflictError (409) cuando expectedUpdatedAt no coincide con el updatedAt actual del odontograma', async () => {
    patientRepo.findById.mockResolvedValue({
      id: 'patient-123',
      clinicId: 'clinic-123',
    } as unknown as Patient);

    const existingOdontogram = Odontogram.create({
      id: 'odon-existing',
      clinicId: 'clinic-123',
      patientId: 'patient-123',
      hasTemporalDentition: false,
      findings: [],
      createdAt: new Date('2026-10-15T09:00:00.000Z'),
      updatedAt: new Date('2026-10-15T10:00:00.000Z'),
    });
    odontogramRepo.findByPatientId.mockResolvedValue(existingOdontogram);

    // Intento con expectedUpdatedAt obsoleto
    await expect(
      useCase.execute({
        clinicId: 'clinic-123',
        patientId: 'patient-123',
        hasTemporalDentition: false,
        findings: [],
        expectedUpdatedAt: '2026-10-15T09:00:00.000Z',
      }),
    ).rejects.toThrow(OdontogramConflictError);

    // Intento con expectedUpdatedAt coincidente debe funcionar
    clock.now.mockReturnValue(new Date('2026-10-15T11:00:00.000Z'));
    const updated = await useCase.execute({
      clinicId: 'clinic-123',
      patientId: 'patient-123',
      hasTemporalDentition: false,
      findings: [],
      expectedUpdatedAt: '2026-10-15T10:00:00.000Z',
    });

    expect(updated).toBeDefined();
    expect(odontogramRepo.save).toHaveBeenCalledWith(
      existingOdontogram,
      new Date('2026-10-15T10:00:00.000Z'),
    );
  });
});
