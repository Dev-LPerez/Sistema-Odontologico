import { Module } from '@nestjs/common';
import { SharedModule, PrismaModule } from '../../shared';
import { IdentityModule } from '../identity';
import { PatientsModule } from '../patients';
import { CatalogsModule } from '../catalogs';
import { CLINICAL_HISTORY_REPOSITORY_PORT } from './domain/clinical-history.repository.port';
import { ODONTOGRAM_REPOSITORY_PORT } from './domain/odontogram.repository.port';
import { ODONTOGRAM_SNAPSHOT_REPOSITORY_PORT } from './domain/odontogram-snapshot.repository.port';
import { PrismaClinicalHistoryRepository } from './infrastructure/repositories/prisma-clinical-history.repository';
import { PrismaOdontogramRepository } from './infrastructure/repositories/prisma-odontogram.repository';
import { PrismaOdontogramSnapshotRepository } from './infrastructure/repositories/prisma-odontogram-snapshot.repository';
import { CreateClinicalHistoryUseCase } from './application/use-cases/create-clinical-history.use-case';
import { UpdateClinicalHistoryUseCase } from './application/use-cases/update-clinical-history.use-case';
import { AddTreatmentPlanItemUseCase } from './application/use-cases/add-treatment-plan-item.use-case';
import { UpdateTreatmentPlanItemStatusUseCase } from './application/use-cases/update-treatment-plan-item-status.use-case';
import { UpsertPatientOdontogramUseCase } from './application/use-cases/upsert-patient-odontogram.use-case';
import { CreateOdontogramSnapshotUseCase } from './application/use-cases/create-odontogram-snapshot.use-case';
import { GetClinicalHistoryByPatientQuery } from './application/queries/get-clinical-history-by-patient.query';
import { GetOdontogramByPatientQuery } from './application/queries/get-odontogram-by-patient.query';
import { ListOdontogramSnapshotsQuery } from './application/queries/list-odontogram-snapshots.query';
import { ClinicalHistoryController } from './presentation/clinical-history.controller';
import { OdontogramController } from './presentation/odontogram.controller';

@Module({
  imports: [SharedModule, PrismaModule, IdentityModule, PatientsModule, CatalogsModule],
  controllers: [ClinicalHistoryController, OdontogramController],
  providers: [
    {
      provide: CLINICAL_HISTORY_REPOSITORY_PORT,
      useClass: PrismaClinicalHistoryRepository,
    },
    {
      provide: ODONTOGRAM_REPOSITORY_PORT,
      useClass: PrismaOdontogramRepository,
    },
    {
      provide: ODONTOGRAM_SNAPSHOT_REPOSITORY_PORT,
      useClass: PrismaOdontogramSnapshotRepository,
    },
    CreateClinicalHistoryUseCase,
    UpdateClinicalHistoryUseCase,
    AddTreatmentPlanItemUseCase,
    UpdateTreatmentPlanItemStatusUseCase,
    UpsertPatientOdontogramUseCase,
    CreateOdontogramSnapshotUseCase,
    GetClinicalHistoryByPatientQuery,
    GetOdontogramByPatientQuery,
    ListOdontogramSnapshotsQuery,
  ],
  exports: [
    CLINICAL_HISTORY_REPOSITORY_PORT,
    ODONTOGRAM_REPOSITORY_PORT,
    ODONTOGRAM_SNAPSHOT_REPOSITORY_PORT,
    CreateClinicalHistoryUseCase,
    UpdateClinicalHistoryUseCase,
    AddTreatmentPlanItemUseCase,
    UpdateTreatmentPlanItemStatusUseCase,
    UpsertPatientOdontogramUseCase,
    CreateOdontogramSnapshotUseCase,
    GetClinicalHistoryByPatientQuery,
    GetOdontogramByPatientQuery,
    ListOdontogramSnapshotsQuery,
  ],
})
export class ClinicalModule {}
