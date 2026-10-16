import { ToothFinding } from './tooth-finding.vo';
import { ToothNumber } from './tooth-number.vo';
import { ToothSurface } from './tooth-surface.enum';
import { FindingCatalogCode } from './finding-catalog.enum';
import { FindingStatus } from './finding-status.enum';
import { InvalidOdontogramDataError } from './clinical.errors';

describe('ToothFinding Value Object', () => {
  const tooth16 = ToothNumber.of(16);

  it('debe crear exitosamente un hallazgo con superficie, código de catálogo y estado válidos', () => {
    const finding = ToothFinding.create({
      toothNumber: tooth16,
      surface: ToothSurface.OCCLUSAL,
      findingCode: FindingCatalogCode.CARIES,
      status: FindingStatus.EXISTING,
      notes: 'Caries de fosa oclusal profunda',
    });

    expect(finding.toothNumber.value).toBe(16);
    expect(finding.surface).toBe(ToothSurface.OCCLUSAL);
    expect(finding.findingCode).toBe(FindingCatalogCode.CARIES);
    expect(finding.status).toBe(FindingStatus.EXISTING);
    expect(finding.notes).toBe('Caries de fosa oclusal profunda');
    expect(finding.createdAt).toBeInstanceOf(Date);
  });

  it('debe crear hallazgos para toda la pieza dental con WHOLE_TOOTH', () => {
    const finding = ToothFinding.create({
      toothNumber: tooth16,
      surface: ToothSurface.WHOLE_TOOTH,
      findingCode: FindingCatalogCode.ABSENT,
      status: FindingStatus.EXISTING,
    });

    expect(finding.surface).toBe(ToothSurface.WHOLE_TOOTH);
    expect(finding.findingCode).toBe(FindingCatalogCode.ABSENT);
    expect(finding.notes).toBeNull();
  });

  it('debe rechazar un código de catálogo inexistente con InvalidOdontogramDataError', () => {
    expect(() =>
      ToothFinding.create({
        toothNumber: tooth16,
        surface: ToothSurface.OCCLUSAL,
        findingCode: 'UNKNOWN_CODE' as unknown as FindingCatalogCode,
        status: FindingStatus.EXISTING,
      }),
    ).toThrow(InvalidOdontogramDataError);
  });

  it('debe rechazar una superficie inexistente con InvalidOdontogramDataError', () => {
    expect(() =>
      ToothFinding.create({
        toothNumber: tooth16,
        surface: 'INVALID_SURFACE' as unknown as ToothSurface,
        findingCode: FindingCatalogCode.CARIES,
        status: FindingStatus.EXISTING,
      }),
    ).toThrow(InvalidOdontogramDataError);
  });

  it('debe rechazar un estado de hallazgo inexistente con InvalidOdontogramDataError', () => {
    expect(() =>
      ToothFinding.create({
        toothNumber: tooth16,
        surface: ToothSurface.OCCLUSAL,
        findingCode: FindingCatalogCode.CARIES,
        status: 'INVALID_STATUS' as unknown as FindingStatus,
      }),
    ).toThrow(InvalidOdontogramDataError);
  });

  it('debe serializar a objeto plano determinista con toPlainObject()', () => {
    const finding = ToothFinding.create({
      toothNumber: tooth16,
      surface: ToothSurface.MESIAL,
      findingCode: FindingCatalogCode.RESIN_RESTORATION,
      status: FindingStatus.PERFORMED,
      notes: 'Resina fotocurada clase II',
    });

    const plain = finding.toPlainObject();
    expect(plain).toEqual({
      toothNumber: 16,
      surface: 'MESIAL',
      findingCode: 'RESIN_RESTORATION',
      status: 'PERFORMED',
      notes: 'Resina fotocurada clase II',
      createdAt: finding.createdAt.toISOString(),
    });
  });
});
