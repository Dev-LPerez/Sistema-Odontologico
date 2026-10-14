// Public API exports for Patients module (Regla 9)
export * from './domain/patient.entity';
export * from './domain/document-identity.vo';
export * from './domain/phone-number.vo';
export * from './domain/emergency-contact.vo';
export * from './domain/document-type.enum';
export * from './domain/acquisition-source.enum';
export * from './domain/patients.errors';
export * from './domain/patient.repository.port';

export * from './application/use-cases/create-patient.use-case';
export * from './application/use-cases/update-patient.use-case';
export * from './application/use-cases/change-patient-status.use-case';
export * from './application/queries/get-patient-by-id.query';
export * from './application/queries/list-patients.query';
export * from './application/queries/detect-duplicate-patients.query';

export * from './patients.module';
