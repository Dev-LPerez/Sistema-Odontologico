import { Module } from '@nestjs/common';
import { SharedModule, PrismaModule } from '../../shared';
import { IdentityModule } from '../identity';
import { PatientsModule } from '../patients';
import { CatalogsModule } from '../catalogs';
import { CLINICAL_HISTORY_REPOSITORY_PORT } from './domain/clinical-history.repository.port';
import { PrismaClinicalHistoryRepository } from './infrastructure/repositories/prisma-clinical-history.repository';
import { CreateClinicalHistoryUseCase } from './application/use-cases/create-clinical-history.use-case';
import { UpdateClinicalHistoryUseCase } from './application/use-cases/update-clinical-history.use-case';
import { AddTreatmentPlanItemUseCase } from './application/use-cases/add-treatment-plan-item.use-case';
import { UpdateTreatmentPlanItemStatusUseCase } from './application/use-cases/update-treatment-plan-item-status.use-case';
import { GetClinicalHistoryByPatientQuery } from './application/queries/get-clinical-history-by-patient.query';
import { ClinicalHistoryController } from './presentation/clinical-history.controller';

@Module({
  imports: [SharedModule, PrismaModule, IdentityModule, PatientsModule, CatalogsModule],
  controllers: [ClinicalHistoryController],
  providers: [
    {
      provide: CLINICAL_HISTORY_REPOSITORY_PORT,
      useClass: PrismaClinicalHistoryRepository,
    },
    CreateClinicalHistoryUseCase,
    UpdateClinicalHistoryUseCase,
    AddTreatmentPlanItemUseCase,
    UpdateTreatmentPlanItemStatusUseCase,
    GetClinicalHistoryByPatientQuery,
  ],
  exports: [
    CLINICAL_HISTORY_REPOSITORY_PORT,
    CreateClinicalHistoryUseCase,
    UpdateClinicalHistoryUseCase,
    AddTreatmentPlanItemUseCase,
    UpdateTreatmentPlanItemStatusUseCase,
    GetClinicalHistoryByPatientQuery,
  ],
})
export class ClinicalModule {}
