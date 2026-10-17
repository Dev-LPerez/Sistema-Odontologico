import { PrismaService, cleanDatabaseForContractTests } from '../../../../shared';
import { ClinicalHistoryRepositoryPort } from '../../domain/clinical-history.repository.port';
import { ClinicalHistoryVersionRepositoryPort } from '../../domain/clinical-history-version.repository.port';
import { InMemoryClinicalHistoryRepository } from './in-memory-clinical-history.repository';
import { InMemoryClinicalHistoryVersionRepository } from './in-memory-clinical-history-version.repository';
import { PrismaClinicalHistoryRepository } from './prisma-clinical-history.repository';
import { PrismaClinicalHistoryVersionRepository } from './prisma-clinical-history-version.repository';
import { ClinicalHistory } from '../../domain/clinical-history.entity';
import { ClinicalHistoryVersion } from '../../domain/clinical-history-version.entity';
import { MedicalAntecedents } from '../../domain/medical-antecedents.vo';
import { TreatmentPlanItem } from '../../domain/treatment-plan-item.entity';
import { TreatmentItemStatus } from '../../domain/treatment-item-status.enum';
import {
  DuplicateClinicalHistoryError,
  DuplicateClinicalHistoryVersionError,
} from '../../domain/clinical.errors';
import { Prisma } from '@prisma/client';

interface RepositoryFactory {
  name: string;
  createRepo: () => {
    repo: ClinicalHistoryRepositoryPort;
    versionRepo: ClinicalHistoryVersionRepositoryPort;
    cleanup?: () => Promise<void>;
  };
}

describe('ClinicalHistory Repository Contract Tests (RC-018, RC-050, RC-055)', () => {
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
    await cleanDatabaseForContractTests(realPrisma);
  };

  const ensurePrerequisites = async () => {
    await realPrisma.clinic.upsert({
      where: { id: 'clinic-contract-1' },
      create: { id: 'clinic-contract-1', name: 'Clínica Contract 1' },
      update: {},
    });
    await realPrisma.clinic.upsert({
      where: { id: 'clinic-contract-2' },
      create: { id: 'clinic-contract-2', name: 'Clínica Contract 2' },
      update: {},
    });

    await realPrisma.patient.upsert({
      where: { id: 'pat-contract-1' },
      create: {
        id: 'pat-contract-1',
        clinicId: 'clinic-contract-1',
        firstName: 'Juan',
        lastName: 'Pérez',
        documentType: 'CC',
        documentNumber: '99001122',
        birthDate: new Date('1990-01-01'),
        phone: '3009900112',
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
        firstName: 'María',
        lastName: 'López',
        documentType: 'CC',
        documentNumber: '88001122',
        birthDate: new Date('1992-05-10'),
        phone: '3008800112',
        dataTreatmentConsent: true,
        dataTreatmentConsentAt: fixedNow,
      },
      update: {},
    });

    await realPrisma.procedure.upsert({
      where: { id: 'proc-contract-1' },
      create: {
        id: 'proc-contract-1',
        clinicId: 'clinic-contract-1',
        code: 'PROC-C1',
        name: 'Profilaxis',
        basePriceCop: 80000,
      },
      update: {},
    });
  };

  const implementations: RepositoryFactory[] = [
    {
      name: 'InMemoryClinicalHistoryRepository',
      createRepo: () => {
        const repo = new InMemoryClinicalHistoryRepository();
        const versionRepo = new InMemoryClinicalHistoryVersionRepository();
        return {
          repo,
          versionRepo,
          cleanup: async () => {
            repo.clear();
            versionRepo.clear();
          },
        };
      },
    },
    {
      name: 'PrismaClinicalHistoryRepository (PostgreSQL Real)',
      createRepo: () => {
        const repo = new PrismaClinicalHistoryRepository(realPrisma);
        const versionRepo = new PrismaClinicalHistoryVersionRepository(realPrisma);
        return {
          repo,
          versionRepo,
          cleanup: async () => {
            await cleanDb();
            await ensurePrerequisites();
          },
        };
      },
    },
  ];

  implementations.forEach(({ name, createRepo }) => {
    describe(`Suite Contract: ${name}`, () => {
      let repo: ClinicalHistoryRepositoryPort;
      let versionRepo: ClinicalHistoryVersionRepositoryPort;
      let cleanup: (() => Promise<void>) | undefined;

      beforeEach(async () => {
        const context = createRepo();
        repo = context.repo;
        versionRepo = context.versionRepo;
        cleanup = context.cleanup;
        if (cleanup) {
          await cleanup();
        }
      });

      afterAll(async () => {
        if (cleanup) {
          await cleanup();
        }
      });

      it('debe guardar atómicamente una versión inmutable en ClinicalHistoryVersion al actualizar la historia clínica y permitir listar sus versiones', async () => {
        const history = ClinicalHistory.create({
          id: 'hist-contract-ver-1',
          clinicId: 'clinic-contract-1',
          patientId: 'pat-contract-1',
          chiefComplaint: 'Dolor inicial',
          currentIllness: 'Evolución de 2 días',
          medicalAntecedents: MedicalAntecedents.create({
            hypertension: false,
            diabetes: false,
            allergies: false,
            medications: false,
            bleedingDisorders: false,
            pregnancy: false,
          }),
          createdAt: fixedNow,
          updatedAt: fixedNow,
        });

        await repo.save(history);

        const version1 = ClinicalHistoryVersion.create({
          id: 'ver-contract-1',
          clinicId: 'clinic-contract-1',
          clinicalHistoryId: history.id,
          versionNumber: 1,
          previousData: history.toSnapshotData(),
          changeReason: 'Control postoperatorio',
          updatedByUserId: 'usr-admin-1',
          createdAt: fixedNow,
        });

        await versionRepo.save(version1);

        history.update({
          chiefComplaint: 'Sin dolor tras tratamiento',
          updatedAt: new Date('2026-10-15T12:00:00.000Z'),
        });
        await repo.save(history);

        const versions = await versionRepo.findAllByHistoryId('clinic-contract-1', history.id);
        expect(versions).toHaveLength(1);
        expect(versions[0].versionNumber).toBe(1);
        expect(versions[0].previousData.chiefComplaint).toBe('Dolor inicial');
        expect(versions[0].changeReason).toBe('Control postoperatorio');

        const reloaded = await repo.findById('clinic-contract-1', history.id);
        expect(reloaded?.chiefComplaint).toBe('Sin dolor tras tratamiento');
      });

      it('debe rechazar con DuplicateClinicalHistoryVersionError al intentar guardar una versión con número duplicado', async () => {
        const history = ClinicalHistory.create({
          id: 'hist-contract-ver-dup',
          clinicId: 'clinic-contract-1',
          patientId: 'pat-contract-1',
          chiefComplaint: 'Dolor inicial',
          currentIllness: 'Evolución de 2 días',
          medicalAntecedents: MedicalAntecedents.create({
            hypertension: false,
            diabetes: false,
            allergies: false,
            medications: false,
            bleedingDisorders: false,
            pregnancy: false,
          }),
          createdAt: fixedNow,
          updatedAt: fixedNow,
        });
        await repo.save(history);

        const version1 = ClinicalHistoryVersion.create({
          id: 'ver-contract-dup-1',
          clinicId: 'clinic-contract-1',
          clinicalHistoryId: history.id,
          versionNumber: 1,
          previousData: history.toSnapshotData(),
          changeReason: 'Primera versión',
          createdAt: fixedNow,
        });
        await versionRepo.save(version1);

        const versionDuplicate = ClinicalHistoryVersion.create({
          id: 'ver-contract-dup-2',
          clinicId: 'clinic-contract-1',
          clinicalHistoryId: history.id,
          versionNumber: 1,
          previousData: history.toSnapshotData(),
          changeReason: 'Versión duplicada con el mismo versionNumber',
          createdAt: fixedNow,
        });

        await expect(versionRepo.save(versionDuplicate)).rejects.toThrow(
          DuplicateClinicalHistoryVersionError,
        );
      });

      it('debe crear, actualizar y consultar la historia clínica con antecedentes y diagnósticos aislando por clinicId', async () => {
        const antecedents1 = MedicalAntecedents.create({
          hypertension: false,
          diabetes: false,
          allergies: true,
          allergiesDetails: 'Penicilina',
          medications: true,
          medicationsDetails: 'Amoxicilina 500mg',
          bleedingDisorders: false,
          pregnancy: false,
          otherNotes: 'Anotación especial',
          familyAntecedents: 'Madre hipertensa',
        });

        const history1 = ClinicalHistory.create({
          id: 'hist-contract-1',
          clinicId: 'clinic-contract-1',
          patientId: 'pat-contract-1',
          chiefComplaint: 'Dolor dental severo',
          currentIllness: 'Dolor continuo desde hace 2 días',
          medicalAntecedents: antecedents1,
          clinicalExamination: 'Caries cavitada en 16',
          diagnoses: [{ code: 'K02.1', description: 'Caries de la dentina' }],
          createdAt: fixedNow,
          updatedAt: fixedNow,
        });

        await repo.save(history1);

        const found = await repo.findByPatientId('clinic-contract-1', 'pat-contract-1');
        expect(found).not.toBeNull();
        expect(found?.id).toBe('hist-contract-1');
        expect(found?.chiefComplaint).toBe('Dolor dental severo');
        expect(found?.medicalAntecedents.allergies).toBe(true);
        expect(found?.medicalAntecedents.allergiesDetails).toBe('Penicilina');
        expect(found?.medicalAntecedents.familyAntecedents).toBe('Madre hipertensa');

        // Aislamiento por consultorio (clinicId)
        const foundOtherClinic = await repo.findByPatientId('clinic-contract-2', 'pat-contract-1');
        expect(foundOtherClinic).toBeNull();

        // Actualización
        const updatedDate = new Date('2026-10-15T12:00:00.000Z');
        history1.update({
          chiefComplaint: 'Dolor moderado post-tratamiento',
          currentIllness: 'Evolución satisfactoria',
          updatedAt: updatedDate,
        });
        await repo.save(history1);

        const foundAfterUpdate = await repo.findById('clinic-contract-1', 'hist-contract-1');
        expect(foundAfterUpdate?.chiefComplaint).toBe('Dolor moderado post-tratamiento');
        expect(foundAfterUpdate?.currentIllness).toBe('Evolución satisfactoria');
        expect(foundAfterUpdate?.updatedAt).toEqual(updatedDate);
      });

      it('debe lanzar DuplicateClinicalHistoryError (409) cuando el paciente ya tiene historia clínica en el consultorio (P2002)', async () => {
        const antecedents = MedicalAntecedents.create({
          hypertension: false,
          diabetes: false,
          allergies: false,
          medications: false,
          bleedingDisorders: false,
          pregnancy: false,
        });

        const history1 = ClinicalHistory.create({
          id: 'hist-dup-1',
          clinicId: 'clinic-contract-1',
          patientId: 'pat-contract-1',
          chiefComplaint: 'Primera historia',
          currentIllness: 'Enfermedad 1',
          medicalAntecedents: antecedents,
          createdAt: fixedNow,
          updatedAt: fixedNow,
        });
        await repo.save(history1);

        const history2 = ClinicalHistory.create({
          id: 'hist-dup-2',
          clinicId: 'clinic-contract-1',
          patientId: 'pat-contract-1',
          chiefComplaint: 'Segunda historia para el mismo paciente',
          currentIllness: 'Enfermedad 2',
          medicalAntecedents: antecedents,
          createdAt: fixedNow,
          updatedAt: fixedNow,
        });

        await expect(repo.save(history2)).rejects.toThrow(DuplicateClinicalHistoryError);
      });

      it('debe agregar ítems al plan de tratamiento resolviendo el costo y actualizar su estado a COMPLETED calculando totalEstimatedCostCop', async () => {
        const antecedents = MedicalAntecedents.create({
          hypertension: false,
          diabetes: false,
          allergies: false,
          medications: false,
          bleedingDisorders: false,
          pregnancy: false,
        });

        const history = ClinicalHistory.create({
          id: 'hist-plan-1',
          clinicId: 'clinic-contract-1',
          patientId: 'pat-contract-1',
          chiefComplaint: 'Plan de prueba',
          currentIllness: 'Evaluación integral',
          medicalAntecedents: antecedents,
          createdAt: fixedNow,
          updatedAt: fixedNow,
        });

        const item1 = TreatmentPlanItem.create({
          id: 'item-contract-1',
          clinicId: 'clinic-contract-1',
          clinicalHistoryId: 'hist-plan-1',
          procedureId: 'proc-contract-1',
          procedureCode: 'PROC-C1',
          procedureName: 'Profilaxis',
          toothNumber: '16',
          status: TreatmentItemStatus.PENDING,
          estimatedCostCop: 80000,
          notes: 'Limpieza inicial',
          createdAt: fixedNow,
          updatedAt: fixedNow,
        });

        history.addTreatmentPlanItem(item1);
        await repo.save(history);

        const savedHistory = await repo.findById('clinic-contract-1', 'hist-plan-1');
        expect(savedHistory?.treatmentItems).toHaveLength(1);
        expect(savedHistory?.treatmentItems[0].status).toBe(TreatmentItemStatus.PENDING);
        expect(savedHistory?.totalEstimatedCostCop).toBe(80000);

        // Actualizar estado a COMPLETED
        const completedDate = new Date('2026-10-15T13:00:00.000Z');
        history.updateTreatmentPlanItemStatus(
          'item-contract-1',
          TreatmentItemStatus.COMPLETED,
          completedDate,
        );
        await repo.save(history);

        const updatedHistory = await repo.findById('clinic-contract-1', 'hist-plan-1');
        expect(updatedHistory?.treatmentItems[0].status).toBe(TreatmentItemStatus.COMPLETED);
        expect(updatedHistory?.treatmentItems[0].updatedAt).toEqual(completedDate);
        expect(updatedHistory?.totalEstimatedCostCop).toBe(80000);
      });
    });
  });

  describe('Restricciones de Integridad Referencial onDelete: Restrict (RC-055)', () => {
    beforeEach(async () => {
      await cleanDb();
      await ensurePrerequisites();
    });

    it('debe rechazar la eliminación del paciente si tiene una historia clínica asociada (P2003 onDelete: Restrict)', async () => {
      const repo = new PrismaClinicalHistoryRepository(realPrisma);

      const history = ClinicalHistory.create({
        id: 'hist-restrict-patient',
        clinicId: 'clinic-contract-1',
        patientId: 'pat-contract-1',
        chiefComplaint: 'Consulta',
        currentIllness: 'Enfermedad',
        medicalAntecedents: MedicalAntecedents.create({
          hypertension: false,
          diabetes: false,
          allergies: false,
          medications: false,
          bleedingDisorders: false,
          pregnancy: false,
        }),
        createdAt: fixedNow,
        updatedAt: fixedNow,
      });

      await repo.save(history);

      await expect(realPrisma.patient.delete({ where: { id: 'pat-contract-1' } })).rejects.toThrow(
        Prisma.PrismaClientKnownRequestError,
      );
    });

    it('debe rechazar la eliminación del procedimiento si está referenciado en un ítem del plan de tratamiento (P2003 onDelete: Restrict)', async () => {
      const repo = new PrismaClinicalHistoryRepository(realPrisma);

      const history = ClinicalHistory.create({
        id: 'hist-restrict-proc',
        clinicId: 'clinic-contract-1',
        patientId: 'pat-contract-1',
        chiefComplaint: 'Consulta',
        currentIllness: 'Enfermedad',
        medicalAntecedents: MedicalAntecedents.create({
          hypertension: false,
          diabetes: false,
          allergies: false,
          medications: false,
          bleedingDisorders: false,
          pregnancy: false,
        }),
        createdAt: fixedNow,
        updatedAt: fixedNow,
      });

      const item = TreatmentPlanItem.create({
        id: 'item-restrict-proc',
        clinicId: 'clinic-contract-1',
        clinicalHistoryId: 'hist-restrict-proc',
        procedureId: 'proc-contract-1',
        procedureCode: 'PROC-C1',
        procedureName: 'Profilaxis',
        toothNumber: null,
        status: TreatmentItemStatus.PENDING,
        estimatedCostCop: 80000,
        notes: null,
        createdAt: fixedNow,
        updatedAt: fixedNow,
      });

      history.addTreatmentPlanItem(item);
      await repo.save(history);

      await expect(
        realPrisma.procedure.delete({ where: { id: 'proc-contract-1' } }),
      ).rejects.toThrow(Prisma.PrismaClientKnownRequestError);
    });

    it('debe rechazar la eliminación del consultorio si tiene historias clínicas asociadas (P2003 onDelete: Restrict)', async () => {
      const repo = new PrismaClinicalHistoryRepository(realPrisma);

      const history = ClinicalHistory.create({
        id: 'hist-restrict-clinic',
        clinicId: 'clinic-contract-1',
        patientId: 'pat-contract-1',
        chiefComplaint: 'Consulta',
        currentIllness: 'Enfermedad',
        medicalAntecedents: MedicalAntecedents.create({
          hypertension: false,
          diabetes: false,
          allergies: false,
          medications: false,
          bleedingDisorders: false,
          pregnancy: false,
        }),
        createdAt: fixedNow,
        updatedAt: fixedNow,
      });

      await repo.save(history);

      await expect(
        realPrisma.clinic.delete({ where: { id: 'clinic-contract-1' } }),
      ).rejects.toThrow(Prisma.PrismaClientKnownRequestError);
    });
  });
});
