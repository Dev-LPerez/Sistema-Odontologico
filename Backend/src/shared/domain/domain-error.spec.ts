import { DomainError, DomainErrorCategory } from './domain-error';

class TestDomainError extends DomainError {
  readonly category: DomainErrorCategory = 'CONFLICT';
  readonly code = 'TEST_CONFLICT';
}

class TestValidationError extends DomainError {
  readonly category: DomainErrorCategory = 'VALIDATION';
  readonly code = 'VALIDATION_FAILED';
}

class TestInvariantError extends DomainError {
  readonly category: DomainErrorCategory = 'INVARIANT_VIOLATION';
  readonly code = 'INVARIANT_BROKEN';
}

describe('DomainError', () => {
  it('debe instanciar correctamente con mensaje, código, categoría y nombre de error', () => {
    const error = new TestDomainError('El recurso ya existe');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(DomainError);
    expect(error.message).toBe('El recurso ya existe');
    expect(error.category).toBe('CONFLICT');
    expect(error.code).toBe('TEST_CONFLICT');
    expect(error.name).toBe('TestDomainError');
  });

  it('debe almacenar metadatos opcionales', () => {
    const metadata = { field: 'email', value: 'dr@example.com' };
    const error = new TestValidationError('Email inválido', metadata);

    expect(error.metadata).toEqual(metadata);
  });

  it('debe soportar diferentes categorías de error de dominio', () => {
    const error = new TestInvariantError('Invariante violada');
    expect(error.category).toBe('INVARIANT_VIOLATION');
    expect(error.code).toBe('INVARIANT_BROKEN');
  });
});
