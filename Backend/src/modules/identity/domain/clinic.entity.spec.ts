import { Clinic } from './clinic.entity';

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
});
