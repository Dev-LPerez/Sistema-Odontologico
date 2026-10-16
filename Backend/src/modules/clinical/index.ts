// Public API exports for Clinical module (Regla 9)
export * from './domain/clinical-history.entity';
export * from './domain/medical-antecedents.vo';
export * from './domain/treatment-plan-item.entity';
export * from './domain/treatment-item-status.enum';
export * from './domain/clinical.errors';
export * from './domain/clinical-history.repository.port';

export * from './domain/odontogram.entity';
export * from './domain/odontogram-snapshot.entity';
export * from './domain/tooth-number.vo';
export * from './domain/tooth-finding.vo';
export * from './domain/tooth-surface.enum';
export * from './domain/finding-catalog.enum';
export * from './domain/finding-status.enum';
export * from './domain/odontogram.repository.port';
export * from './domain/odontogram-snapshot.repository.port';

export * from './domain/clinical-attention-status.enum';
export * from './domain/attention-material-used.entity';
export * from './domain/clinical-attention.entity';
export * from './domain/clinical-attention.repository.port';
export * from './domain/clinical-attention-version.entity';
export * from './domain/clinical-attention-version.repository.port';

export * from './application/use-cases/create-clinical-history.use-case';
export * from './application/use-cases/update-clinical-history.use-case';
export * from './application/use-cases/add-treatment-plan-item.use-case';
export * from './application/use-cases/update-treatment-plan-item-status.use-case';
export * from './application/use-cases/upsert-patient-odontogram.use-case';
export * from './application/use-cases/create-odontogram-snapshot.use-case';
export * from './application/use-cases/create-clinical-attention.use-case';
export * from './application/use-cases/update-clinical-attention.use-case';
export * from './application/use-cases/add-attention-material-used.use-case';
export * from './application/use-cases/close-clinical-attention.use-case';
export * from './application/use-cases/amend-closed-clinical-attention.use-case';
export * from './application/queries/get-clinical-history-by-patient.query';
export * from './application/queries/get-odontogram-by-patient.query';
export * from './application/queries/list-odontogram-snapshots.query';
export * from './application/queries/list-clinical-attentions-by-patient.query';
export * from './application/queries/get-clinical-attention-by-id.query';
export * from './application/queries/list-clinical-attention-versions.query';
export * from './application/ports/clinical-history-pdf-generator.port';
export * from './application/queries/export-clinical-history-pdf.query';

export * from './clinical.module';
