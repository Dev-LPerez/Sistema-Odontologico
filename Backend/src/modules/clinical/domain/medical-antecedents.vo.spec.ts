import { MedicalAntecedents } from './medical-antecedents.vo';
import { InvalidClinicalHistoryDataError } from './clinical.errors';

describe('MedicalAntecedents VO', () => {
  const validProps = {
    hypertension: false,
    diabetes: false,
    allergies: true,
    allergiesDetails: 'Penicilina',
    medications: true,
    medicationsDetails: 'Amoxicilina 500mg cada 8 horas',
    bleedingDisorders: false,
    pregnancy: false,
    otherNotes: 'Ninguna otra observación',
    familyAntecedents: 'Madre con antecedentes de diabetes',
  };

  it('debe crear una instancia válida de MedicalAntecedents con antecedentes completos', () => {
    const vo = MedicalAntecedents.create(validProps);

    expect(vo.hypertension).toBe(false);
    expect(vo.diabetes).toBe(false);
    expect(vo.allergies).toBe(true);
    expect(vo.allergiesDetails).toBe('Penicilina');
    expect(vo.medications).toBe(true);
    expect(vo.medicationsDetails).toBe('Amoxicilina 500mg cada 8 horas');
    expect(vo.bleedingDisorders).toBe(false);
    expect(vo.pregnancy).toBe(false);
    expect(vo.otherNotes).toBe('Ninguna otra observación');
    expect(vo.familyAntecedents).toBe('Madre con antecedentes de diabetes');
  });

  it('debe lanzar InvalidClinicalHistoryDataError cuando allergies o medications es true sin detalle o chiefComplaint está vacío', () => {
    // Alergias en true sin detalle
    expect(() =>
      MedicalAntecedents.create({
        ...validProps,
        allergies: true,
        allergiesDetails: '',
      }),
    ).toThrow(InvalidClinicalHistoryDataError);

    expect(() =>
      MedicalAntecedents.create({
        ...validProps,
        allergies: true,
        allergiesDetails: '   ',
      }),
    ).toThrow(InvalidClinicalHistoryDataError);

    expect(() =>
      MedicalAntecedents.create({
        ...validProps,
        allergies: true,
        allergiesDetails: null,
      }),
    ).toThrow(InvalidClinicalHistoryDataError);

    // Medicación activa en true sin detalle
    expect(() =>
      MedicalAntecedents.create({
        ...validProps,
        medications: true,
        medicationsDetails: '',
      }),
    ).toThrow(InvalidClinicalHistoryDataError);

    expect(() =>
      MedicalAntecedents.create({
        ...validProps,
        medications: true,
        medicationsDetails: '   ',
      }),
    ).toThrow(InvalidClinicalHistoryDataError);

    expect(() =>
      MedicalAntecedents.create({
        ...validProps,
        medications: true,
        medicationsDetails: null,
      }),
    ).toThrow(InvalidClinicalHistoryDataError);
  });

  it('debe permitir detalles vacíos o nulos si allergies o medications son false', () => {
    const vo = MedicalAntecedents.create({
      hypertension: true,
      diabetes: true,
      allergies: false,
      allergiesDetails: null,
      medications: false,
      medicationsDetails: null,
      bleedingDisorders: false,
      pregnancy: false,
    });

    expect(vo.allergies).toBe(false);
    expect(vo.allergiesDetails).toBeNull();
    expect(vo.medications).toBe(false);
    expect(vo.medicationsDetails).toBeNull();
  });
});
