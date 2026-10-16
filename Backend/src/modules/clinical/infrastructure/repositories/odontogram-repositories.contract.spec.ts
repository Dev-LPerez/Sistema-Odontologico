import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { OdontogramRepositoryPort } from '../../domain/odontogram.repository.port';
import { OdontogramSnapshotRepositoryPort } from '../../domain/odontogram-snapshot.repository.port';
import { InMemoryOdontogramRepository } from './in-memory-odontogram.repository';
import { InMemoryOdontogramSnapshotRepository } from './in-memory-odontogram-snapshot.repository';
import { PrismaOdontogramRepository } from './prisma-odontogram.repository';
import { PrismaOdontogramSnapshotRepository } from './prisma-odontogram-snapshot.repository';
import { Odontogram } from '../../domain/odontogram.entity';
import { OdontogramSnapshot } from '../../domain/odontogram-snapshot.entity';
import { ToothFinding } from '../../domain/tooth-finding.vo';
import { ToothNumber } from '../../domain/tooth-number.vo';
import { ToothSurface } from '../../domain/tooth-surface.enum';
import { FindingCatalogCode } from '../../domain/finding-catalog.enum';
import { FindingStatus } from '../../domain/finding-status.enum';
import { DuplicateOdontogramError } from '../../domain/clinical.errors';
import { Prisma } from '@prisma/client';

interface RepositoryFactory {
  name: string;
  createOdontogramRepo: () => {
    repo: OdontogramRepositoryPort;
    cleanup?: () => Promise<void>;
  };
  createSnapshotRepo: () => {
    repo: OdontogramSnapshotRepositoryPort;
    cleanup?: () => Promise<void>;
  };
}

describe('Odontogram Repositories Contract Tests (RC-018, RC-050, RC-055)', () => {
  const realPrisma = new PrismaService();
  const fixedNow = new Date('2026-10-15T10:00:00.000Z');

  beforeAll(async () => {
    await realPrisma.$connect();
  });

  afterAll(async () => {
    await cleanDb();
    await realPrisma.$disconnect();
  });

  const cleanDb = async () => {
    await realPrisma.clinicalAttentionVersion.deleteMany();
    await realPrisma.attentionMaterialUsed.deleteMany();
    await realPrisma.clinicalAttention.deleteMany();
    await realPrisma.treatmentPlanItem.deleteMany();
    await realPrisma.clinicalHistory.deleteMany();
    await realPrisma.patientProcedurePrice.deleteMany();
    await realPrisma.procedure.deleteMany();
    await realPrisma.material.deleteMany();
    await realPrisma.odontogramSnapshot.deleteMany();
    await realPrisma.odontogram.deleteMany();
    await realPrisma.patient.deleteMany();
    await realPrisma.refreshSession.deleteMany();
    await realPrisma.user.deleteMany();
    await realPrisma.clinic.deleteMany();
  };

  const ensurePrerequisites = async () => {
    await realPrisma.clinic.upsert({
      where: { id: 'clinic-contract-1' },
      create: { id: 'clinic-contract-1', name: 'Clínica Odontograma 1' },
      update: {},
    });
    await realPrisma.clinic.upsert({
      where: { id: 'clinic-contract-2' },
      create: { id: 'clinic-contract-2', name: 'Clínica Odontograma 2' },
      update: {},
    });

    await realPrisma.patient.upsert({
      where: { id: 'pat-contract-1' },
      create: {
        id: 'pat-contract-1',
        clinicId: 'clinic-contract-1',
        firstName: 'Carlos',
        lastName: 'Mendoza',
        documentType: 'CC',
        documentNumber: '77001122',
        birthDate: new Date('1990-01-01'),
        phone: '3007700112',
        dataTreatmentConsent: true,
        dataTreatmentConsentAt: fixedNow,
      },
      update: {},
    });

    await realPrisma.patient.upsert({
      where: { id: 'pat-contract-2' },
      create: {
        id: 'pat-contract-2',
        clinicId: 'clinic-contract-2',
        firstName: 'Ana',
        lastName: 'Gómez',
        documentType: 'CC',
        documentNumber: '66001122',
        birthDate: new Date('1995-05-15'),
        phone: '3006600112',
        dataTreatmentConsent: true,
        dataTreatmentConsentAt: fixedNow,
      },
      update: {},
    });
  };

  const implementations: RepositoryFactory[] = [
    {
      name: 'InMemoryOdontogramRepositories',
      createOdontogramRepo: () => {
        const repo = new InMemoryOdontogramRepository();
        return {
          repo,
          cleanup: async () => repo.clear(),
        };
      },
      createSnapshotRepo: () => {
        const repo = new InMemoryOdontogramSnapshotRepository();
        return {
          repo,
          cleanup: async () => repo.clear(),
        };
      },
    },
    {
      name: 'PrismaOdontogramRepositories (PostgreSQL Real)',
      createOdontogramRepo: () => {
        const repo = new PrismaOdontogramRepository(realPrisma);
        return {
          repo,
          cleanup: async () => {
            await cleanDb();
            await ensurePrerequisites();
          },
        };
      },
      createSnapshotRepo: () => {
        const repo = new PrismaOdontogramSnapshotRepository(realPrisma);
        return {
          repo,
          cleanup: async () => {
            await cleanDb();
            await ensurePrerequisites();
          },
        };
      },
    },
  ];

  implementations.forEach(({ name, createOdontogramRepo, createSnapshotRepo }) => {
    describe(`Suite Contract: ${name}`, () => {
      let odontogramRepo: OdontogramRepositoryPort;
      let snapshotRepo: OdontogramSnapshotRepositoryPort;
      let cleanupOdonto: (() => Promise<void>) | undefined;
      let cleanupSnap: (() => Promise<void>) | undefined;

      beforeEach(async () => {
        const ctxOdonto = createOdontogramRepo();
        odontogramRepo = ctxOdonto.repo;
        cleanupOdonto = ctxOdonto.cleanup;

        const ctxSnap = createSnapshotRepo();
        snapshotRepo = ctxSnap.repo;
        cleanupSnap = ctxSnap.cleanup;

        if (cleanupOdonto) {
          await cleanupOdonto();
        }
        if (cleanupSnap) {
          await cleanupSnap();
        }
      });

      afterEach(async () => {
        if (cleanupOdonto) {
          await cleanupOdonto();
        }
        if (cleanupSnap) {
          await cleanupSnap();
        }
      });

      it('debe guardar, actualizar y consultar el odontograma estructurado con dientes permanentes y temporales aislando por clinicId', async () => {
        const finding16 = ToothFinding.create({
          toothNumber: ToothNumber.of(16),
          surface: ToothSurface.OCCLUSAL,
          findingCode: FindingCatalogCode.CARIES,
          status: FindingStatus.EXISTING,
          notes: 'Fosa oclusal profunda',
          createdAt: fixedNow,
        });
        const finding55 = ToothFinding.create({
          toothNumber: ToothNumber.of(55),
          surface: ToothSurface.VESTIBULAR,
          findingCode: FindingCatalogCode.RESIN_RESTORATION,
          status: FindingStatus.PERFORMED,
          notes: 'Resina temporal clase V',
          createdAt: fixedNow,
        });

        const odontogram1 = Odontogram.create({
          id: 'odon-contract-1',
          clinicId: 'clinic-contract-1',
          patientId: 'pat-contract-1',
          hasTemporalDentition: true,
          findings: [finding16, finding55],
          createdAt: fixedNow,
          updatedAt: fixedNow,
        });

        await odontogramRepo.save(odontogram1);

        // Aislamiento multitenant: pat-contract-1 no debe ser visible desde clinic-contract-2
        const otherClinicQuery = await odontogramRepo.findByPatientId(
          'clinic-contract-2',
          'pat-contract-1',
        );
        expect(otherClinicQuery).toBeNull();

        // Consulta exitosa desde la clínica correcta
        const found = await odontogramRepo.findByPatientId('clinic-contract-1', 'pat-contract-1');
        expect(found).not.toBeNull();
        expect(found!.id).toBe('odon-contract-1');
        expect(found!.hasTemporalDentition).toBe(true);
        expect(found!.findings).toHaveLength(2);

        // Actualización del odontograma
        const updatedFinding = ToothFinding.create({
          toothNumber: ToothNumber.of(16),
          surface: ToothSurface.OCCLUSAL,
          findingCode: FindingCatalogCode.RESIN_RESTORATION,
          status: FindingStatus.PERFORMED,
          notes: 'Restaurada',
          createdAt: fixedNow,
        });
        const newUpdatedAt = new Date('2026-10-15T11:00:00.000Z');
        found!.updateFindings([updatedFinding], true, newUpdatedAt);

        await odontogramRepo.save(found!);

        const refreshed = await odontogramRepo.findByPatientId(
          'clinic-contract-1',
          'pat-contract-1',
        );
        expect(refreshed!.findings).toHaveLength(1);
        expect(refreshed!.findings[0].findingCode).toBe(FindingCatalogCode.RESIN_RESTORATION);
        expect(refreshed!.findings[0].status).toBe(FindingStatus.PERFORMED);
      });

      it('debe crear una instantánea inmutable del odontograma y conservar su estado histórico aunque el odontograma cambie después', async () => {
        const finding16 = ToothFinding.create({
          toothNumber: ToothNumber.of(16),
          surface: ToothSurface.OCCLUSAL,
          findingCode: FindingCatalogCode.CARIES,
          status: FindingStatus.EXISTING,
          createdAt: fixedNow,
        });

        const activeOdonto = Odontogram.create({
          id: 'odon-contract-snap',
          clinicId: 'clinic-contract-1',
          patientId: 'pat-contract-1',
          hasTemporalDentition: false,
          findings: [finding16],
          createdAt: fixedNow,
          updatedAt: fixedNow,
        });
        await odontogramRepo.save(activeOdonto);

        const snapshot = OdontogramSnapshot.create({
          id: 'snap-contract-1',
          clinicId: 'clinic-contract-1',
          patientId: 'pat-contract-1',
          odontogramId: activeOdonto.id,
          hasTemporalDentition: activeOdonto.hasTemporalDentition,
          snapshotData: activeOdonto.toStructuredJson() as unknown as Record<string, unknown>,
          notes: 'Snapshot inicial pretratamiento',
          createdAt: fixedNow,
        });
        await snapshotRepo.save(snapshot);

        // Ahora modificamos el odontograma activo
        const performedResin = ToothFinding.create({
          toothNumber: ToothNumber.of(16),
          surface: ToothSurface.OCCLUSAL,
          findingCode: FindingCatalogCode.RESIN_RESTORATION,
          status: FindingStatus.PERFORMED,
          createdAt: new Date('2026-10-15T14:00:00.000Z'),
        });
        activeOdonto.updateFindings([performedResin], false, new Date('2026-10-15T14:00:00.000Z'));
        await odontogramRepo.save(activeOdonto);

        // Listamos las instantáneas y comprobamos que conserva 'CARIES'
        const snapshots = await snapshotRepo.findAllByPatientId(
          'clinic-contract-1',
          'pat-contract-1',
        );
        expect(snapshots).toHaveLength(1);
        expect(snapshots[0].id).toBe('snap-contract-1');
        const snapTeeth = (
          snapshots[0].snapshotData as {
            teeth: Record<string, Array<{ findingCode: string; status: string }>>;
          }
        ).teeth;
        expect(snapTeeth['16'][0].findingCode).toBe('CARIES');
        expect(snapTeeth['16'][0].status).toBe('EXISTING');
      });

      it('debe lanzar DuplicateOdontogramError (409) cuando ya existe un odontograma para el paciente en el consultorio (P2002)', async () => {
        const odon1 = Odontogram.create({
          id: 'odon-unique-1',
          clinicId: 'clinic-contract-1',
          patientId: 'pat-contract-1',
          hasTemporalDentition: false,
          findings: [],
          createdAt: fixedNow,
          updatedAt: fixedNow,
        });
        await odontogramRepo.save(odon1);

        const odonDuplicate = Odontogram.create({
          id: 'odon-unique-2',
          clinicId: 'clinic-contract-1',
          patientId: 'pat-contract-1',
          hasTemporalDentition: false,
          findings: [],
          createdAt: fixedNow,
          updatedAt: fixedNow,
        });

        await expect(odontogramRepo.save(odonDuplicate)).rejects.toThrow(DuplicateOdontogramError);
      });
    });
  });

  describe('PostgreSQL Real Restrict Constraints (RC-055)', () => {
    beforeEach(async () => {
      await cleanDb();
      await ensurePrerequisites();
    });

    it('debe rechazar la eliminación del paciente si tiene un odontograma asociado (P2003 onDelete: Restrict)', async () => {
      const repo = new PrismaOdontogramRepository(realPrisma);

      const odon = Odontogram.create({
        id: 'odon-restrict-patient',
        clinicId: 'clinic-contract-1',
        patientId: 'pat-contract-1',
        hasTemporalDentition: false,
        findings: [],
        createdAt: fixedNow,
        updatedAt: fixedNow,
      });

      await repo.save(odon);

      await expect(realPrisma.patient.delete({ where: { id: 'pat-contract-1' } })).rejects.toThrow(
        Prisma.PrismaClientKnownRequestError,
      );
    });

    it('debe rechazar la eliminación del consultorio si tiene un odontograma asociado (P2003 onDelete: Restrict)', async () => {
      const repo = new PrismaOdontogramRepository(realPrisma);

      const odon = Odontogram.create({
        id: 'odon-restrict-clinic',
        clinicId: 'clinic-contract-1',
        patientId: 'pat-contract-1',
        hasTemporalDentition: false,
        findings: [],
        createdAt: fixedNow,
        updatedAt: fixedNow,
      });

      await repo.save(odon);

      await expect(
        realPrisma.clinic.delete({ where: { id: 'clinic-contract-1' } }),
      ).rejects.toThrow(Prisma.PrismaClientKnownRequestError);
    });

    it('debe rechazar la eliminación del odontograma si tiene instantáneas asociadas (P2003 onDelete: Restrict)', async () => {
      const odontoRepo = new PrismaOdontogramRepository(realPrisma);
      const snapRepo = new PrismaOdontogramSnapshotRepository(realPrisma);

      const odon = Odontogram.create({
        id: 'odon-parent-restrict',
        clinicId: 'clinic-contract-1',
        patientId: 'pat-contract-1',
        hasTemporalDentition: false,
        findings: [],
        createdAt: fixedNow,
        updatedAt: fixedNow,
      });
      await odontoRepo.save(odon);

      const snap = OdontogramSnapshot.create({
        id: 'snap-child-restrict',
        clinicId: 'clinic-contract-1',
        patientId: 'pat-contract-1',
        odontogramId: odon.id,
        hasTemporalDentition: false,
        snapshotData: { teeth: {} },
        createdAt: fixedNow,
      });
      await snapRepo.save(snap);

      await expect(
        realPrisma.odontogram.delete({ where: { id: 'odon-parent-restrict' } }),
      ).rejects.toThrow(Prisma.PrismaClientKnownRequestError);
    });
  });
});
