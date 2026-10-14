import { Email } from './email.vo';
import { InvalidEmailError } from './identity.errors';

describe('Email Value Object', () => {
  it('debe crear un Email válido normalizado en minúsculas y sin espacios', () => {
    const raw = '  Dra.Angelee@DentalCare.COM  ';
    const email = Email.create(raw);

    expect(email.value).toBe('dra.angelee@dentalcare.com');
  });

  it('debe lanzar InvalidEmailError cuando el formato es inválido', () => {
    const invalidEmails = [
      '',
      '   ',
      'invalido',
      'sin-arroba.com',
      '@sin-usuario.com',
      'usuario@.com',
      'usuario@dominio',
    ];

    for (const raw of invalidEmails) {
      expect(() => Email.create(raw)).toThrow(InvalidEmailError);
    }
  });

  it('debe comparar igualdad entre dos instancias de Email', () => {
    const email1 = Email.create('doctora@clinica.com');
    const email2 = Email.create('DOCTORA@clinica.com');
    const email3 = Email.create('auxiliar@clinica.com');

    expect(email1.equals(email2)).toBe(true);
    expect(email1.equals(email3)).toBe(false);
  });
});
