import { EmergencyContact } from './emergency-contact.vo';
import { PhoneNumber } from './phone-number.vo';
import { InvalidPatientDataError } from './patients.errors';

describe('EmergencyContact Value Object', () => {
  const validPhone = PhoneNumber.create('3109876543');

  it('debe crear un contacto de emergencia válido y recortar espacios en el nombre', () => {
    const contact = EmergencyContact.create('  María Gómez  ', validPhone);

    expect(contact.name).toBe('María Gómez');
    expect(contact.phone).toBe(validPhone);
  });

  it('debe rechazar un contacto de emergencia con nombre vacío o solo espacios', () => {
    expect(() => EmergencyContact.create('', validPhone)).toThrow(InvalidPatientDataError);
    expect(() => EmergencyContact.create('   ', validPhone)).toThrow(InvalidPatientDataError);
    expect(() => EmergencyContact.create(null as unknown as string, validPhone)).toThrow(
      InvalidPatientDataError,
    );
  });
});
