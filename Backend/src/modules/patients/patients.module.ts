import { Module } from '@nestjs/common';
import { SharedModule, PrismaModule } from '../../shared';
import { IdentityModule } from '../identity';
import { PATIENT_REPOSITORY_TOKEN } from './domain/patient.repository.port';
import { PrismaPatientRepository } from './infrastructure/repositories/prisma-patient.repository';
import { CreatePatientUseCase } from './application/use-cases/create-patient.use-case';
import { UpdatePatientUseCase } from './application/use-cases/update-patient.use-case';
import { ChangePatientStatusUseCase } from './application/use-cases/change-patient-status.use-case';
import { GetPatientByIdQuery } from './application/queries/get-patient-by-id.query';
import { ListPatientsQuery } from './application/queries/list-patients.query';
import { DetectDuplicatePatientsQuery } from './application/queries/detect-duplicate-patients.query';
import { PatientsController } from './presentation/patients.controller';

@Module({
  imports: [SharedModule, PrismaModule, IdentityModule],
  controllers: [PatientsController],
  providers: [
    {
      provide: PATIENT_REPOSITORY_TOKEN,
      useClass: PrismaPatientRepository,
    },
    CreatePatientUseCase,
    UpdatePatientUseCase,
    ChangePatientStatusUseCase,
    GetPatientByIdQuery,
    ListPatientsQuery,
    DetectDuplicatePatientsQuery,
  ],
  exports: [PATIENT_REPOSITORY_TOKEN, GetPatientByIdQuery, ListPatientsQuery],
})
export class PatientsModule {}
