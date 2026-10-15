// Public API exports for Clinical module (Regla 9)
export * from './domain/clinical-history.entity';
export * from './domain/medical-antecedents.vo';
export * from './domain/treatment-plan-item.entity';
export * from './domain/treatment-item-status.enum';
export * from './domain/clinical.errors';
export * from './domain/clinical-history.repository.port';

export * from './application/use-cases/create-clinical-history.use-case';
export * from './application/use-cases/update-clinical-history.use-case';
export * from './application/use-cases/add-treatment-plan-item.use-case';
export * from './application/use-cases/update-treatment-plan-item-status.use-case';
export * from './application/queries/get-clinical-history-by-patient.query';

export * from './clinical.module';
