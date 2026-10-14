import { DocumentIdentity } from './document-identity.vo';
import { DocumentType } from './document-type.enum';
import { InvalidPatientDataError } from './patients.errors';

describe('DocumentIdentity Value Object', () => {
  it('debe crear un DocumentIdentity válido y normalizar el número eliminando espacios y caracteres especiales', () => {
    const doc = DocumentIdentity.create(DocumentType.CC, ' 1.020.304-050 ');
    expect(doc.type).toBe(DocumentType.CC);
    expect(doc.number).toBe('1020304050');
  });

  it('debe rechazar un número de documento vacío', () => {
    expect(() => DocumentIdentity.create(DocumentType.CC, '   ')).toThrow(InvalidPatientDataError);
  });

  it('debe comparar igualdad por tipo y número', () => {
    const doc1 = DocumentIdentity.create(DocumentType.CC, '1020304050');
    const doc2 = DocumentIdentity.create(DocumentType.CC, ' 1020304050 ');
    const doc3 = DocumentIdentity.create(DocumentType.TI, '1020304050');

    expect(doc1.equals(doc2)).toBe(true);
    expect(doc1.equals(doc3)).toBe(false);
  });
});
