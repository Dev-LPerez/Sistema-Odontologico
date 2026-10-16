import { Module } from '@nestjs/common';
import { SharedModule, PrismaModule } from '../../shared';
import { IdentityModule } from '../identity';
import { PatientsModule } from '../patients';
import { CatalogsModule } from '../catalogs';
import { CLINICAL_HISTORY_REPOSITORY_PORT } from './domain/clinical-history.repository.port';
import { ODONTOGRAM_REPOSITORY_PORT } from './domain/odontogram.repository.port';
import { ODONTOGRAM_SNAPSHOT_REPOSITORY_PORT } from './domain/odontogram-snapshot.repository.port';
import { CLINICAL_ATTENTION_REPOSITORY_PORT } from './domain/clinical-attention.repository.port';
import { CLINICAL_ATTENTION_VERSION_REPOSITORY_PORT } from './domain/clinical-attention-version.repository.port';
import { PrismaClinicalHistoryRepository } from './infrastructure/repositories/prisma-clinical-history.repository';
import { PrismaOdontogramRepository } from './infrastructure/repositories/prisma-odontogram.repository';
import { PrismaOdontogramSnapshotRepository } from './infrastructure/repositories/prisma-odontogram-snapshot.repository';
import { PrismaClinicalAttentionRepository } from './infrastructure/repositories/prisma-clinical-attention.repository';
import { PrismaClinicalAttentionVersionRepository } from './infrastructure/repositories/prisma-clinical-attention-version.repository';
import { CreateClinicalHistoryUseCase } from './application/use-cases/create-clinical-history.use-case';
import { UpdateClinicalHistoryUseCase } from './application/use-cases/update-clinical-history.use-case';
import { AddTreatmentPlanItemUseCase } from './application/use-cases/add-treatment-plan-item.use-case';
import { UpdateTreatmentPlanItemStatusUseCase } from './application/use-cases/update-treatment-plan-item-status.use-case';
import { UpsertPatientOdontogramUseCase } from './application/use-cases/upsert-patient-odontogram.use-case';
import { CreateOdontogramSnapshotUseCase } from './application/use-cases/create-odontogram-snapshot.use-case';
import { CreateClinicalAttentionUseCase } from './application/use-cases/create-clinical-attention.use-case';
import { UpdateClinicalAttentionUseCase } from './application/use-cases/update-clinical-attention.use-case';
import { AddAttentionMaterialUsedUseCase } from './application/use-cases/add-attention-material-used.use-case';
import { CloseClinicalAttentionUseCase } from './application/use-cases/close-clinical-attention.use-case';
import { AmendClosedClinicalAttentionUseCase } from './application/use-cases/amend-closed-clinical-attention.use-case';
import { GetClinicalHistoryByPatientQuery } from './application/queries/get-clinical-history-by-patient.query';
import { GetOdontogramByPatientQuery } from './application/queries/get-odontogram-by-patient.query';
import { ListOdontogramSnapshotsQuery } from './application/queries/list-odontogram-snapshots.query';
import { ListClinicalAttentionsByPatientQuery } from './application/queries/list-clinical-attentions-by-patient.query';
import { GetClinicalAttentionByIdQuery } from './application/queries/get-clinical-attention-by-id.query';
import { ListClinicalAttentionVersionsQuery } from './application/queries/list-clinical-attention-versions.query';
import { ExportClinicalHistoryPdfQuery } from './application/queries/export-clinical-history-pdf.query';
import { GetToothMaterialHistoryQuery } from './application/queries/get-tooth-material-history.query';
import { CLINICAL_HISTORY_PDF_GENERATOR_PORT } from './application/ports/clinical-history-pdf-generator.port';
import { PdfmakeClinicalHistoryPdfGeneratorAdapter } from './infrastructure/adapters/pdfmake-clinical-history-pdf-generator.adapter';
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
    {
      provide: CLINICAL_ATTENTION_VERSION_REPOSITORY_PORT,
      useClass: PrismaClinicalAttentionVersionRepository,
    },
    {
      provide: CLINICAL_HISTORY_PDF_GENERATOR_PORT,
      useClass: PdfmakeClinicalHistoryPdfGeneratorAdapter,
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
    CloseClinicalAttentionUseCase,
    AmendClosedClinicalAttentionUseCase,
    GetClinicalHistoryByPatientQuery,
    GetOdontogramByPatientQuery,
    ListOdontogramSnapshotsQuery,
    ListClinicalAttentionsByPatientQuery,
    GetClinicalAttentionByIdQuery,
    ListClinicalAttentionVersionsQuery,
    ExportClinicalHistoryPdfQuery,
    GetToothMaterialHistoryQuery,
  ],
  exports: [
    CLINICAL_HISTORY_REPOSITORY_PORT,
    ODONTOGRAM_REPOSITORY_PORT,
    ODONTOGRAM_SNAPSHOT_REPOSITORY_PORT,
    CLINICAL_ATTENTION_REPOSITORY_PORT,
    CLINICAL_ATTENTION_VERSION_REPOSITORY_PORT,
    CLINICAL_HISTORY_PDF_GENERATOR_PORT,
    CreateClinicalHistoryUseCase,
    UpdateClinicalHistoryUseCase,
    AddTreatmentPlanItemUseCase,
    UpdateTreatmentPlanItemStatusUseCase,
    UpsertPatientOdontogramUseCase,
    CreateOdontogramSnapshotUseCase,
    CreateClinicalAttentionUseCase,
    UpdateClinicalAttentionUseCase,
    AddAttentionMaterialUsedUseCase,
    CloseClinicalAttentionUseCase,
    AmendClosedClinicalAttentionUseCase,
    GetClinicalHistoryByPatientQuery,
    GetOdontogramByPatientQuery,
    ListOdontogramSnapshotsQuery,
    ListClinicalAttentionsByPatientQuery,
    GetClinicalAttentionByIdQuery,
    ListClinicalAttentionVersionsQuery,
    ExportClinicalHistoryPdfQuery,
    GetToothMaterialHistoryQuery,
  ],
})
export class ClinicalModule {}
