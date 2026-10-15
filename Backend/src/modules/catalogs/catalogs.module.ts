import { Module } from '@nestjs/common';
import { SharedModule, PrismaModule } from '../../shared';
import { IdentityModule } from '../identity';
import { PatientsModule } from '../patients';
import { PROCEDURE_REPOSITORY_PORT } from './domain/procedure.repository.port';
import { PATIENT_PROCEDURE_PRICE_REPOSITORY_PORT } from './domain/patient-procedure-price.repository.port';
import { MATERIAL_REPOSITORY_PORT } from './domain/material.repository.port';
import { PrismaProcedureRepository } from './infrastructure/repositories/prisma-procedure.repository';
import { PrismaPatientProcedurePriceRepository } from './infrastructure/repositories/prisma-patient-procedure-price.repository';
import { PrismaMaterialRepository } from './infrastructure/repositories/prisma-material.repository';
import { CreateProcedureUseCase } from './application/use-cases/create-procedure.use-case';
import { UpdateProcedureUseCase } from './application/use-cases/update-procedure.use-case';
import { ListProceduresQuery } from './application/queries/list-procedures.query';
import { SetPatientProcedurePriceUseCase } from './application/use-cases/set-patient-procedure-price.use-case';
import { ListPatientProcedurePricesQuery } from './application/queries/list-patient-procedure-prices.query';
import { CreateMaterialUseCase } from './application/use-cases/create-material.use-case';
import { UpdateMaterialUseCase } from './application/use-cases/update-material.use-case';
import { ConsumeMaterialStockUseCase } from './application/use-cases/consume-material-stock.use-case';
import { ListMaterialsQuery } from './application/queries/list-materials.query';
import { CatalogsController } from './presentation/catalogs.controller';

@Module({
  imports: [SharedModule, PrismaModule, IdentityModule, PatientsModule],
  controllers: [CatalogsController],
  providers: [
    {
      provide: PROCEDURE_REPOSITORY_PORT,
      useClass: PrismaProcedureRepository,
    },
    {
      provide: PATIENT_PROCEDURE_PRICE_REPOSITORY_PORT,
      useClass: PrismaPatientProcedurePriceRepository,
    },
    {
      provide: MATERIAL_REPOSITORY_PORT,
      useClass: PrismaMaterialRepository,
    },
    CreateProcedureUseCase,
    UpdateProcedureUseCase,
    ListProceduresQuery,
    SetPatientProcedurePriceUseCase,
    ListPatientProcedurePricesQuery,
    CreateMaterialUseCase,
    UpdateMaterialUseCase,
    ConsumeMaterialStockUseCase,
    ListMaterialsQuery,
  ],
  exports: [
    PROCEDURE_REPOSITORY_PORT,
    PATIENT_PROCEDURE_PRICE_REPOSITORY_PORT,
    MATERIAL_REPOSITORY_PORT,
    CreateProcedureUseCase,
    UpdateProcedureUseCase,
    ListProceduresQuery,
    SetPatientProcedurePriceUseCase,
    ListPatientProcedurePricesQuery,
    CreateMaterialUseCase,
    UpdateMaterialUseCase,
    ConsumeMaterialStockUseCase,
    ListMaterialsQuery,
  ],
})
export class CatalogsModule {}
