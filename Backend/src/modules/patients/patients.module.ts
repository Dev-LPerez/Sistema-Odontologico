import { Module } from '@nestjs/common';
import { SharedModule, PrismaModule } from '../../shared';
import { IdentityModule } from '../identity';
import { PATIENT_REPOSITORY_TOKEN } from './domain/patient.repository.port';
import { PrismaPatientRepository } from './infrastructure/repositories/prisma-patient.repository';
import { PATIENT_QUERIES_TOKEN } from './application/ports/patient.queries.port';
import { PrismaPatientQueriesAdapter } from './infrastructure/queries/prisma-patient.queries';
import { CreatePatientUseCase } from './application/use-cases/create-patient.use-case';
import { UpdatePatientUseCase } from './application/use-cases/update-patient.use-case';
import { ChangePatientStatusUseCase } from './application/use-cases/change-patient-status.use-case';
import { GetPatientByIdQuery } from './application/queries/get-patient-by-id.query';
import { ListPatientsQuery } from './application/queries/list-patients.query';
import { DetectDuplicatePatientsQuery } from './application/queries/detect-duplicate-patients.query';
import { SearchPatientsQuery } from './application/queries/search-patients.query';
import { PatientsController } from './presentation/patients.controller';

@Module({
  imports: [SharedModule, PrismaModule, IdentityModule],
  controllers: [PatientsController],
  providers: [
    {
      provide: PATIENT_REPOSITORY_TOKEN,
      useClass: PrismaPatientRepository,
    },
    {
      provide: PATIENT_QUERIES_TOKEN,
      useClass: PrismaPatientQueriesAdapter,
    },
    CreatePatientUseCase,
    UpdatePatientUseCase,
    ChangePatientStatusUseCase,
    GetPatientByIdQuery,
    ListPatientsQuery,
    DetectDuplicatePatientsQuery,
    SearchPatientsQuery,
  ],
  exports: [
    PATIENT_REPOSITORY_TOKEN,
    PATIENT_QUERIES_TOKEN,
    GetPatientByIdQuery,
    ListPatientsQuery,
    SearchPatientsQuery,
  ],
})
export class PatientsModule {}
