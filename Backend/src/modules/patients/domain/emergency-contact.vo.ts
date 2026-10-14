import { PhoneNumber } from './phone-number.vo';
import { InvalidPatientDataError } from './patients.errors';

export class EmergencyContact {
  private constructor(
    readonly name: string,
    readonly phone: PhoneNumber,
  ) {}

  static create(rawName: string, phone: PhoneNumber): EmergencyContact {
    if (!rawName || rawName.trim().length === 0) {
      throw new InvalidPatientDataError(
        'El nombre del contacto de emergencia no puede estar vacío',
      );
    }

    return new EmergencyContact(rawName.trim(), phone);
  }
}
