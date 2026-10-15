// Public API exports for Catalogs module (Regla 9)
export * from './domain/money.vo';
export * from './domain/procedure.entity';
export * from './domain/patient-procedure-price.entity';
export * from './domain/material.entity';
export * from './domain/catalogs.errors';
export * from './domain/procedure.repository.port';
export * from './domain/patient-procedure-price.repository.port';
export * from './domain/material.repository.port';

export * from './application/use-cases/create-procedure.use-case';
export * from './application/use-cases/update-procedure.use-case';
export * from './application/queries/list-procedures.query';
export * from './application/use-cases/set-patient-procedure-price.use-case';
export * from './application/queries/list-patient-procedure-prices.query';
export * from './application/use-cases/create-material.use-case';
export * from './application/use-cases/update-material.use-case';
export * from './application/use-cases/consume-material-stock.use-case';
export * from './application/queries/list-materials.query';

export * from './catalogs.module';
