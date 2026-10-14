import { Patient } from './patient.entity';
import { DocumentIdentity } from './document-identity.vo';
import { PhoneNumber } from './phone-number.vo';
import { EmergencyContact } from './emergency-contact.vo';
import { DocumentType } from './document-type.enum';
import { AcquisitionSource } from './acquisition-source.enum';
import { DataTreatmentConsentRequiredError, InvalidPatientDataError } from './patients.errors';

describe('Patient Aggregate', () => {
  const fixedNow = new Date('2026-10-14T10:00:00.000Z');

  const validProps = {
    id: 'patient-1',
    clinicId: 'clinic-123',
    firstName: 'Carlos',
    lastName: 'Gómez',
    document: DocumentIdentity.create(DocumentType.CC, '1020304050'),
    birthDate: new Date('1990-05-15T00:00:00.000Z'),
    phone: PhoneNumber.create('3001234567'),
    email: 'carlos@example.com',
    address: 'Calle 100 # 15-20',
    emergencyContact: EmergencyContact.create('María Gómez', PhoneNumber.create('3109876543')),
    acquisitionSource: AcquisitionSource.INSTAGRAM,
    dataTreatmentConsent: true,
    dataTreatmentConsentAt: fixedNow,
    isActive: true,
    createdAt: fixedNow,
    updatedAt: fixedNow,
  };

  it('debe registrar un paciente activo con consentimiento Ley 1581 y asignar dataTreatmentConsentAt', () => {
    const patient = Patient.create(validProps);

    expect(patient.id).toBe('patient-1');
    expect(patient.clinicId).toBe('clinic-123');
    expect(patient.firstName).toBe('Carlos');
    expect(patient.lastName).toBe('Gómez');
    expect(patient.document.type).toBe(DocumentType.CC);
    expect(patient.document.number).toBe('1020304050');
    expect(patient.phone.value).toBe('3001234567');
    expect(patient.acquisitionSource).toBe(AcquisitionSource.INSTAGRAM);
    expect(patient.dataTreatmentConsent).toBe(true);
    expect(patient.dataTreatmentConsentAt).toEqual(fixedNow);
    expect(patient.isActive).toBe(true);
  });

  it('debe lanzar DataTreatmentConsentRequiredError cuando dataTreatmentConsent es false', () => {
    expect(() =>
      Patient.create({
        ...validProps,
        dataTreatmentConsent: false,
      }),
    ).toThrow(DataTreatmentConsentRequiredError);
  });

  it('debe rechazar nombres o apellidos vacíos', () => {
    expect(() =>
      Patient.create({
        ...validProps,
        firstName: '   ',
      }),
    ).toThrow(InvalidPatientDataError);

    expect(() =>
      Patient.create({
        ...validProps,
        lastName: '',
      }),
    ).toThrow(InvalidPatientDataError);
  });

  it('debe actualizar los datos demográficos, contacto de emergencia y fuente de captación del paciente', () => {
    const patient = Patient.create(validProps);
    const updateTime = new Date('2026-10-14T11:00:00.000Z');

    patient.updateDemographics({
      firstName: 'Carlos Andrés',
      lastName: 'Gómez Pérez',
      phone: PhoneNumber.create('3009998877'),
      email: 'carlos.andres@example.com',
      address: 'Nueva Dirección # 45',
      emergencyContact: EmergencyContact.create('Ana Gómez', PhoneNumber.create('3151112233')),
      acquisitionSource: AcquisitionSource.WHATSAPP,
      updatedAt: updateTime,
    });

    expect(patient.firstName).toBe('Carlos Andrés');
    expect(patient.lastName).toBe('Gómez Pérez');
    expect(patient.phone.value).toBe('3009998877');
    expect(patient.email).toBe('carlos.andres@example.com');
    expect(patient.address).toBe('Nueva Dirección # 45');
    expect(patient.emergencyContact?.name).toBe('Ana Gómez');
    expect(patient.emergencyContact?.phone.value).toBe('3151112233');
    expect(patient.acquisitionSource).toBe(AcquisitionSource.WHATSAPP);
    expect(patient.updatedAt).toEqual(updateTime);
  });

  it('debe rechazar la actualización si el nombre o apellido están vacíos', () => {
    const patient = Patient.create(validProps);
    const updateTime = new Date('2026-10-14T11:00:00.000Z');

    expect(() =>
      patient.updateDemographics({
        firstName: '   ',
        updatedAt: updateTime,
      }),
    ).toThrow('El nombre del paciente no puede estar vacío');

    expect(() =>
      patient.updateDemographics({
        lastName: '',
        updatedAt: updateTime,
      }),
    ).toThrow('El apellido del paciente no puede estar vacío');
  });

  it('debe crear un paciente con campos opcionales nulos', () => {
    const patient = Patient.create({
      ...validProps,
      email: null,
      address: null,
      emergencyContact: null,
    });

    expect(patient.email).toBeNull();
    expect(patient.address).toBeNull();
    expect(patient.emergencyContact).toBeNull();
    expect(patient.birthDate).toEqual(validProps.birthDate);
  });

  it('debe permitir cambiar el estado lógico del paciente (activar y desactivar)', () => {
    const patient = Patient.create(validProps);
    const statusTime = new Date('2026-10-14T12:00:00.000Z');

    patient.changeStatus(false, statusTime);
    expect(patient.isActive).toBe(false);
    expect(patient.updatedAt).toEqual(statusTime);

    patient.changeStatus(true, statusTime);
    expect(patient.isActive).toBe(true);
  });
});
