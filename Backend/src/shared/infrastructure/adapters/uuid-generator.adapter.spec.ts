import { UuidGeneratorAdapter } from './uuid-generator.adapter';

describe('UuidGeneratorAdapter', () => {
  let generator: UuidGeneratorAdapter;

  beforeEach(() => {
    generator = new UuidGeneratorAdapter();
  });

  it('debe generar un UUID v4 válido', () => {
    const id = generator.generate();

    expect(typeof id).toBe('string');
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('debe generar identificadores únicos en llamadas sucesivas', () => {
    const id1 = generator.generate();
    const id2 = generator.generate();

    expect(id1).not.toBe(id2);
  });
});
