import { Argon2PasswordHasherAdapter } from './argon2-password-hasher.adapter';

describe('Argon2PasswordHasherAdapter', () => {
  let adapter: Argon2PasswordHasherAdapter;

  beforeEach(() => {
    adapter = new Argon2PasswordHasherAdapter();
  });

  it('debe generar un hash Argon2 diferente al texto plano', async () => {
    const plain = 'SecretP@ss123!';
    const hash = await adapter.hash(plain);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(plain);
    expect(hash.startsWith('$argon2id$')).toBe(true);
  });

  it('debe verificar correctamente la coincidencia de contraseña', async () => {
    const plain = 'SecretP@ss123!';
    const hash = await adapter.hash(plain);

    const isMatch = await adapter.verify(plain, hash);
    expect(isMatch).toBe(true);
  });

  it('debe retornar false si la contraseña no coincide', async () => {
    const plain = 'SecretP@ss123!';
    const hash = await adapter.hash(plain);

    const isMatch = await adapter.verify('WrongPassword999!', hash);
    expect(isMatch).toBe(false);
  });

  it('debe retornar false si el hash está corrupto o malformado', async () => {
    const isMatch = await adapter.verify('SecretP@ss123!', 'invalid-hash-format');
    expect(isMatch).toBe(false);
  });
});
