import { Inject, Injectable } from '@nestjs/common';
import {
  PATIENT_PROCEDURE_PRICE_REPOSITORY_PORT,
  PatientProcedurePriceRepositoryPort,
} from '../../domain/patient-procedure-price.repository.port';
import { PatientProcedurePrice } from '../../domain/patient-procedure-price.entity';

export interface ListPatientProcedurePricesFilter {
  clinicId: string;
  patientId: string;
}

@Injectable()
export class ListPatientProcedurePricesQuery {
  constructor(
    @Inject(PATIENT_PROCEDURE_PRICE_REPOSITORY_PORT)
    private readonly patientProcedurePriceRepository: PatientProcedurePriceRepositoryPort,
  ) {}

  async execute(filter: ListPatientProcedurePricesFilter): Promise<PatientProcedurePrice[]> {
    return this.patientProcedurePriceRepository.findAllByPatient(filter.clinicId, filter.patientId);
  }
}
