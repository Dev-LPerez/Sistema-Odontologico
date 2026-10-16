import { ToothNumber } from './tooth-number.vo';
import { InvalidOdontogramDataError } from './clinical.errors';

describe('ToothNumber Value Object', () => {
  it('debe crear exitosamente los 32 dientes permanentes FDI reconocidos', () => {
    const permanentQuadrants = [
      [11, 12, 13, 14, 15, 16, 17, 18],
      [21, 22, 23, 24, 25, 26, 27, 28],
      [31, 32, 33, 34, 35, 36, 37, 38],
      [41, 42, 43, 44, 45, 46, 47, 48],
    ];

    let count = 0;
    for (const quadrant of permanentQuadrants) {
      for (const toothNum of quadrant) {
        const tooth = ToothNumber.of(toothNum);
        expect(tooth.value).toBe(toothNum);
        expect(tooth.isPermanent).toBe(true);
        expect(tooth.isTemporal).toBe(false);
        count++;
      }
    }
    expect(count).toBe(32);
  });

  it('debe crear exitosamente los 20 dientes temporales FDI reconocidos', () => {
    const temporalQuadrants = [
      [51, 52, 53, 54, 55],
      [61, 62, 63, 64, 65],
      [71, 72, 73, 74, 75],
      [81, 82, 83, 84, 85],
    ];

    let count = 0;
    for (const quadrant of temporalQuadrants) {
      for (const toothNum of quadrant) {
        const tooth = ToothNumber.of(toothNum);
        expect(tooth.value).toBe(toothNum);
        expect(tooth.isPermanent).toBe(false);
        expect(tooth.isTemporal).toBe(true);
        count++;
      }
    }
    expect(count).toBe(20);
  });

  it('debe lanzar InvalidOdontogramDataError cuando el número de diente FDI es inválido o se registra un diente temporal con hasTemporalDentition en false', () => {
    const invalidNumbers = [0, 10, 19, 29, 39, 49, 50, 56, 60, 66, 70, 76, 80, 86, 90, 99, -1, 100];

    for (const invalid of invalidNumbers) {
      expect(() => ToothNumber.of(invalid)).toThrow(InvalidOdontogramDataError);
    }
  });

  it('debe aceptar números en formato string numérico válido y rechazar strings inválidos', () => {
    const tooth = ToothNumber.of('16');
    expect(tooth.value).toBe(16);
    expect(tooth.code).toBe('16');

    expect(() => ToothNumber.of('abc')).toThrow(InvalidOdontogramDataError);
    expect(() => ToothNumber.of('')).toThrow(InvalidOdontogramDataError);
  });

  it('debe comparar igualdad por valor entre dos objetos de valor ToothNumber', () => {
    const toothA = ToothNumber.of(16);
    const toothB = ToothNumber.of('16');
    const toothC = ToothNumber.of(26);

    expect(toothA.equals(toothB)).toBe(true);
    expect(toothA.equals(toothC)).toBe(false);
  });
});
