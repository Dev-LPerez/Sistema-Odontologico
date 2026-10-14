import { Clinic } from './clinic.entity';
import { InvalidClinicNameError } from './identity.errors';

describe('Clinic Entity', () => {
  it('debe instanciar una entidad Clinic con sus propiedades requeridas y opcionales', () => {
    const now = new Date('2026-10-13T12:00:00.000Z');
    const clinic = Clinic.create({
      id: 'clinic-123',
      name: 'Consultorio Odontológico Dra. Angelee Pacheco',
      address: 'Calle 100 # 15-20',
      phone: '3001234567',
      email: 'contacto@draangelee.com',
      logoUrl: 'https://r2.draangelee.com/logo.png',
      settings: { timezone: 'America/Bogota' },
      createdAt: now,
      updatedAt: now,
    });

    expect(clinic.id).toBe('clinic-123');
    expect(clinic.name).toBe('Consultorio Odontológico Dra. Angelee Pacheco');
    expect(clinic.address).toBe('Calle 100 # 15-20');
    expect(clinic.phone).toBe('3001234567');
    expect(clinic.email).toBe('contacto@draangelee.com');
    expect(clinic.logoUrl).toBe('https://r2.draangelee.com/logo.png');
    expect(clinic.settings).toEqual({ timezone: 'America/Bogota' });
    expect(clinic.createdAt).toEqual(now);
    expect(clinic.updatedAt).toEqual(now);
  });

  it('debe permitir actualizar nombre y datos de contacto de la clínica', () => {
    const now = new Date('2026-10-13T12:00:00.000Z');
    const clinic = Clinic.create({
      id: 'clinic-123',
      name: 'Nombre Antiguo',
      createdAt: now,
      updatedAt: now,
    });

    const updatedDate = new Date('2026-10-13T14:00:00.000Z');
    clinic.updateDetails({
      name: 'Nombre Nuevo',
      phone: '3109998877',
      updatedAt: updatedDate,
    });

    expect(clinic.name).toBe('Nombre Nuevo');
    expect(clinic.phone).toBe('3109998877');
    expect(clinic.updatedAt).toEqual(updatedDate);
  });

  it('debe permitir actualizar dirección, email, logoUrl y settings de la clínica', () => {
    const now = new Date('2026-10-13T12:00:00.000Z');
    const clinic = Clinic.create({
      id: 'clinic-123',
      name: 'Consultorio',
      createdAt: now,
      updatedAt: now,
    });

    const updatedDate = new Date('2026-10-13T15:00:00.000Z');
    clinic.updateDetails({
      address: 'Nueva Dirección # 10',
      email: 'nuevo@clinica.com',
      logoUrl: 'https://r2.clinica.com/nuevo-logo.png',
      settings: { theme: 'dark' },
      updatedAt: updatedDate,
    });

    expect(clinic.address).toBe('Nueva Dirección # 10');
    expect(clinic.email).toBe('nuevo@clinica.com');
    expect(clinic.logoUrl).toBe('https://r2.clinica.com/nuevo-logo.png');
    expect(clinic.settings).toEqual({ theme: 'dark' });
    expect(clinic.updatedAt).toEqual(updatedDate);
  });

  it('debe rechazar la creación de una clínica con nombre vacío o solo espacios', () => {
    const now = new Date('2026-10-13T12:00:00.000Z');

    expect(() =>
      Clinic.create({
        id: 'clinic-empty-1',
        name: '',
        createdAt: now,
        updatedAt: now,
      }),
    ).toThrow(InvalidClinicNameError);

    expect(() =>
      Clinic.create({
        id: 'clinic-empty-2',
        name: '    ',
        createdAt: now,
        updatedAt: now,
      }),
    ).toThrow(InvalidClinicNameError);
  });

  it('debe rechazar la actualización de una clínica con nombre vacío o solo espacios', () => {
    const now = new Date('2026-10-13T12:00:00.000Z');
    const clinic = Clinic.create({
      id: 'clinic-123',
      name: 'Nombre Válido',
      createdAt: now,
      updatedAt: now,
    });

    expect(() =>
      clinic.updateDetails({
        name: '',
        updatedAt: new Date('2026-10-13T13:00:00.000Z'),
      }),
    ).toThrow(InvalidClinicNameError);

    expect(() =>
      clinic.updateDetails({
        name: '   ',
        updatedAt: new Date('2026-10-13T13:00:00.000Z'),
      }),
    ).toThrow(InvalidClinicNameError);
  });
});
