export type DomainErrorCategory =
  'VALIDATION' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT' | 'INVARIANT_VIOLATION';

export abstract class DomainError extends Error {
  abstract readonly category: DomainErrorCategory;
  abstract readonly code: string;
  readonly metadata?: Record<string, unknown>;

  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.metadata = metadata;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
