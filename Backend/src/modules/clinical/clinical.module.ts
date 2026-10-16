import { Module } from '@nestjs/common';
import { SharedModule, PrismaModule } from '../../shared';
import { IdentityModule } from '../identity';
import { PatientsModule } from '../patients';
import { CatalogsModule } from '../catalogs';
import { CLINICAL_HISTORY_REPOSITORY_PORT } from './domain/clinical-history.repository.port';
import { ODONTOGRAM_REPOSITORY_PORT } from './domain/odontogram.repository.port';
import { ODONTOGRAM_SNAPSHOT_REPOSITORY_PORT } from './domain/odontogram-snapshot.repository.port';
import { CLINICAL_ATTENTION_REPOSITORY_PORT } from './domain/clinical-attention.repository.port';
import { PrismaClinicalHistoryRepository } from './infrastructure/repositories/prisma-clinical-history.repository';
import { PrismaOdontogramRepository } from './infrastructure/repositories/prisma-odontogram.repository';
import { PrismaOdontogramSnapshotRepository } from './infrastructure/repositories/prisma-odontogram-snapshot.repository';
import { PrismaClinicalAttentionRepository } from './infrastructure/repositories/prisma-clinical-attention.repository';
import { CreateClinicalHistoryUseCase } from './application/use-cases/create-clinical-history.use-case';
import { UpdateClinicalHistoryUseCase } from './application/use-cases/update-clinical-history.use-case';
import { AddTreatmentPlanItemUseCase } from './application/use-cases/add-treatment-plan-item.use-case';
import { UpdateTreatmentPlanItemStatusUseCase } from './application/use-cases/update-treatment-plan-item-status.use-case';
import { UpsertPatientOdontogramUseCase } from './application/use-cases/upsert-patient-odontogram.use-case';
import { CreateOdontogramSnapshotUseCase } from './application/use-cases/create-odontogram-snapshot.use-case';
import { CreateClinicalAttentionUseCase } from './application/use-cases/create-clinical-attention.use-case';
import { UpdateClinicalAttentionUseCase } from './application/use-cases/update-clinical-attention.use-case';
import { AddAttentionMaterialUsedUseCase } from './application/use-cases/add-attention-material-used.use-case';
import { GetClinicalHistoryByPatientQuery } from './application/queries/get-clinical-history-by-patient.query';
import { GetOdontogramByPatientQuery } from './application/queries/get-odontogram-by-patient.query';
import { ListOdontogramSnapshotsQuery } from './application/queries/list-odontogram-snapshots.query';
import { ListClinicalAttentionsByPatientQuery } from './application/queries/list-clinical-attentions-by-patient.query';
import { GetClinicalAttentionByIdQuery } from './application/queries/get-clinical-attention-by-id.query';
import { ClinicalHistoryController } from './presentation/clinical-history.controller';
import { OdontogramController } from './presentation/odontogram.controller';
import { ClinicalAttentionsController } from './presentation/clinical-attentions.controller';

@Module({
  imports: [SharedModule, PrismaModule, IdentityModule, PatientsModule, CatalogsModule],
  controllers: [ClinicalHistoryController, OdontogramController, ClinicalAttentionsController],
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
    {
      provide: CLINICAL_ATTENTION_REPOSITORY_PORT,
      useClass: PrismaClinicalAttentionRepository,
    },
    CreateClinicalHistoryUseCase,
    UpdateClinicalHistoryUseCase,
    AddTreatmentPlanItemUseCase,
    UpdateTreatmentPlanItemStatusUseCase,
    UpsertPatientOdontogramUseCase,
    CreateOdontogramSnapshotUseCase,
    CreateClinicalAttentionUseCase,
    UpdateClinicalAttentionUseCase,
    AddAttentionMaterialUsedUseCase,
    GetClinicalHistoryByPatientQuery,
    GetOdontogramByPatientQuery,
    ListOdontogramSnapshotsQuery,
    ListClinicalAttentionsByPatientQuery,
    GetClinicalAttentionByIdQuery,
  ],
  exports: [
    CLINICAL_HISTORY_REPOSITORY_PORT,
    ODONTOGRAM_REPOSITORY_PORT,
    ODONTOGRAM_SNAPSHOT_REPOSITORY_PORT,
    CLINICAL_ATTENTION_REPOSITORY_PORT,
    CreateClinicalHistoryUseCase,
    UpdateClinicalHistoryUseCase,
    AddTreatmentPlanItemUseCase,
    UpdateTreatmentPlanItemStatusUseCase,
    UpsertPatientOdontogramUseCase,
    CreateOdontogramSnapshotUseCase,
    CreateClinicalAttentionUseCase,
    UpdateClinicalAttentionUseCase,
    AddAttentionMaterialUsedUseCase,
    GetClinicalHistoryByPatientQuery,
    GetOdontogramByPatientQuery,
    ListOdontogramSnapshotsQuery,
    ListClinicalAttentionsByPatientQuery,
    GetClinicalAttentionByIdQuery,
  ],
})
export class ClinicalModule {}
