import { PhoneNumber } from './phone-number.vo';
import { InvalidPatientDataError } from './patients.errors';

describe('PhoneNumber Value Object', () => {
  it('debe normalizar el teléfono eliminando espacios, guiones y paréntesis', () => {
    const phone = PhoneNumber.create('(300) 123-4567');
    expect(phone.value).toBe('3001234567');
  });

  it('debe permitir teléfonos con prefijo internacional +', () => {
    const phone = PhoneNumber.create('+57 300 123 4567');
    expect(phone.value).toBe('+573001234567');
  });

  it('debe rechazar un teléfono vacío o demasiado corto', () => {
    expect(() => PhoneNumber.create('')).toThrow(InvalidPatientDataError);
    expect(() => PhoneNumber.create('123')).toThrow(InvalidPatientDataError);
  });

  it('debe comparar igualdad entre teléfonos equivalentes', () => {
    const p1 = PhoneNumber.create('300-123-4567');
    const p2 = PhoneNumber.create(' 3001234567 ');
    expect(p1.equals(p2)).toBe(true);
  });
});
