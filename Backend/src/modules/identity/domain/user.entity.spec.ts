import { User } from './user.entity';
import { Email } from './email.vo';
import { UserRole } from './role.enum';
import { UserInactiveError } from './identity.errors';

describe('User Entity', () => {
  const validEmail = Email.create('dra.angelee@consultorio.com');
  const now = new Date('2026-10-13T10:00:00.000Z');

  it('debe instanciar una entidad User con rol ADMIN y estado activo', () => {
    const user = User.create({
      id: 'user-001',
      clinicId: 'clinic-123',
      email: validEmail,
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$abc',
      fullName: 'Dra. Angelee Pacheco',
      role: UserRole.ADMIN,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    expect(user.id).toBe('user-001');
    expect(user.clinicId).toBe('clinic-123');
    expect(user.email.value).toBe('dra.angelee@consultorio.com');
    expect(user.fullName).toBe('Dra. Angelee Pacheco');
    expect(user.role).toBe(UserRole.ADMIN);
    expect(user.isActive).toBe(true);
    expect(() => user.ensureIsActive()).not.toThrow();
  });

  it('debe lanzar UserInactiveError si el usuario está inactivo al invocar ensureIsActive', () => {
    const user = User.create({
      id: 'user-002',
      clinicId: 'clinic-123',
      email: Email.create('auxiliar@consultorio.com'),
      passwordHash: 'hash-xyz',
      fullName: 'Auxiliar Dental',
      role: UserRole.AUXILIARY,
      isActive: false,
      createdAt: now,
      updatedAt: now,
    });

    expect(user.isActive).toBe(false);
    expect(() => user.ensureIsActive()).toThrow(UserInactiveError);
  });

  it('debe permitir desactivar y reactivar el usuario actualizando updatedAt', () => {
    const user = User.create({
      id: 'user-003',
      clinicId: 'clinic-123',
      email: validEmail,
      passwordHash: 'hash-xyz',
      fullName: 'Usuario Prueba',
      role: UserRole.AUXILIARY,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    const time1 = new Date('2026-10-13T11:00:00.000Z');
    user.deactivate(time1);
    expect(user.isActive).toBe(false);
    expect(user.updatedAt).toEqual(time1);

    const time2 = new Date('2026-10-13T12:00:00.000Z');
    user.activate(time2);
    expect(user.isActive).toBe(true);
    expect(user.updatedAt).toEqual(time2);
  });

  it('debe permitir cambiar el hash de contraseña', () => {
    const user = User.create({
      id: 'user-004',
      clinicId: 'clinic-123',
      email: validEmail,
      passwordHash: 'old-hash',
      fullName: 'Usuario Prueba',
      role: UserRole.ADMIN,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    const updateTime = new Date('2026-10-13T15:00:00.000Z');
    user.changePassword('new-secure-hash', updateTime);

    expect(user.passwordHash).toBe('new-secure-hash');
    expect(user.updatedAt).toEqual(updateTime);
  });

  it('debe permitir actualizar el perfil (nombre, correo y rol) actualizando updatedAt', () => {
    const user = User.create({
      id: 'user-005',
      clinicId: 'clinic-123',
      email: validEmail,
      passwordHash: 'hash-xyz',
      fullName: 'Dra. Angelee Pacheco',
      role: UserRole.ADMIN,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    const updateTime = new Date('2026-10-13T16:00:00.000Z');
    const newEmail = Email.create('angelee.nueva@consultorio.com');

    user.updateProfile({
      fullName: 'Dra. Angelee Pacheco M.',
      email: newEmail,
      role: UserRole.AUXILIARY,
      updatedAt: updateTime,
    });

    expect(user.fullName).toBe('Dra. Angelee Pacheco M.');
    expect(user.email.value).toBe('angelee.nueva@consultorio.com');
    expect(user.role).toBe(UserRole.AUXILIARY);
    expect(user.updatedAt).toEqual(updateTime);
  });

  it('debe permitir cambiar de estado mediante changeStatus actualizando updatedAt', () => {
    const user = User.create({
      id: 'user-006',
      clinicId: 'clinic-123',
      email: validEmail,
      passwordHash: 'hash-xyz',
      fullName: 'Usuario Prueba',
      role: UserRole.AUXILIARY,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    const updateTime = new Date('2026-10-13T17:00:00.000Z');
    user.changeStatus(false, updateTime);

    expect(user.isActive).toBe(false);
    expect(user.updatedAt).toEqual(updateTime);

    const reactivateTime = new Date('2026-10-13T18:00:00.000Z');
    user.changeStatus(true, reactivateTime);

    expect(user.isActive).toBe(true);
    expect(user.updatedAt).toEqual(reactivateTime);
  });
});
