import { ClinicalDiagnosis } from './clinical-diagnosis.vo';
import { InvalidClinicalHistoryDataError } from './clinical.errors';

describe('ClinicalDiagnosis VO', () => {
  it('debe crear un diagnóstico a partir de un string de texto', () => {
    const diag = ClinicalDiagnosis.create('Caries dental profunda');
    expect(diag.code).toBeNull();
    expect(diag.description).toBe('Caries dental profunda');
    expect(diag.toPlainObject()).toEqual({
      code: null,
      description: 'Caries dental profunda',
    });
  });

  it('debe crear un diagnóstico a partir de un objeto con code y description', () => {
    const diag = ClinicalDiagnosis.create({
      code: 'K02.1',
      description: 'Caries de la dentina',
    });
    expect(diag.code).toBe('K02.1');
    expect(diag.description).toBe('Caries de la dentina');
    expect(diag.toPlainObject()).toEqual({
      code: 'K02.1',
      description: 'Caries de la dentina',
    });
  });

  it('debe permitir code nulo u omitido en objeto con description', () => {
    const diag = ClinicalDiagnosis.create({
      description: 'Gingivitis marginal crónica',
    });
    expect(diag.code).toBeNull();
    expect(diag.description).toBe('Gingivitis marginal crónica');
  });

  it('debe aceptar objeto con name como fallback de description', () => {
    const diag = ClinicalDiagnosis.create({
      code: 'K05.0',
      name: 'Gingivitis aguda',
    });
    expect(diag.code).toBe('K05.0');
    expect(diag.description).toBe('Gingivitis aguda');
  });

  it('debe usar code como description si description no se envía pero code sí', () => {
    const diag = ClinicalDiagnosis.create({
      code: 'K02.9',
    });
    expect(diag.code).toBe('K02.9');
    expect(diag.description).toBe('K02.9');
  });

  it('debe rechazar con InvalidClinicalHistoryDataError si se envía un string vacío o de espacios', () => {
    expect(() => ClinicalDiagnosis.create('')).toThrow(InvalidClinicalHistoryDataError);
    expect(() => ClinicalDiagnosis.create('   ')).toThrow(InvalidClinicalHistoryDataError);
  });

  it('debe rechazar con InvalidClinicalHistoryDataError si se envía un objeto sin description ni code', () => {
    expect(() => ClinicalDiagnosis.create({})).toThrow(InvalidClinicalHistoryDataError);
    expect(() => ClinicalDiagnosis.create({ description: '   ' })).toThrow(
      InvalidClinicalHistoryDataError,
    );
  });

  it('debe rechazar con InvalidClinicalHistoryDataError si no es string ni objeto', () => {
    expect(() => ClinicalDiagnosis.create(null)).toThrow(InvalidClinicalHistoryDataError);
    expect(() => ClinicalDiagnosis.create(123)).toThrow(InvalidClinicalHistoryDataError);
  });

  it('debe comparar igualdad con equals()', () => {
    const d1 = ClinicalDiagnosis.create({ code: 'K02.1', description: 'Caries' });
    const d2 = ClinicalDiagnosis.create({ code: 'K02.1', description: 'Caries' });
    const d3 = ClinicalDiagnosis.create({ code: 'K02.2', description: 'Caries' });

    expect(d1.equals(d2)).toBe(true);
    expect(d1.equals(d3)).toBe(false);
    expect(d1.equals(null)).toBe(false);
  });
});
