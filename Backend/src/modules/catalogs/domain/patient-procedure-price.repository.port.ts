import { PatientProcedurePrice } from './patient-procedure-price.entity';

export const PATIENT_PROCEDURE_PRICE_REPOSITORY_PORT = Symbol(
  'PatientProcedurePriceRepositoryPort',
);

export interface PatientProcedurePriceRepositoryPort {
  findByPatientAndProcedure(
    clinicId: string,
    patientId: string,
    procedureId: string,
  ): Promise<PatientProcedurePrice | null>;
  findAllByPatient(clinicId: string, patientId: string): Promise<PatientProcedurePrice[]>;
  save(price: PatientProcedurePrice): Promise<void>;
}
