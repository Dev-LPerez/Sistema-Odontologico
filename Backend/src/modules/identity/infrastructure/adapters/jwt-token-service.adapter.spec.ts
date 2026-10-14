import { JwtService } from '@nestjs/jwt';
import { JwtTokenServiceAdapter } from './jwt-token-service.adapter';
import { JwtAccessTokenPayload } from '../../application/ports/token-service.port';

describe('JwtTokenServiceAdapter', () => {
  let adapter: JwtTokenServiceAdapter;
  let jwtService: JwtService;

  beforeEach(() => {
    jwtService = new JwtService({
      secret: 'test-secret-must-be-very-long-and-secure-1234567890',
      signOptions: { expiresIn: '15m' },
    });
    adapter = new JwtTokenServiceAdapter(jwtService);
  });

  const samplePayload: JwtAccessTokenPayload = {
    sub: 'user-uuid-123',
    clinicId: 'clinic-uuid-456',
    role: 'ADMIN',
    email: 'admin@clinica.com',
  };

  it('debe firmar y verificar un access token correctamente', async () => {
    const token = await adapter.signAccessToken(samplePayload);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);

    const verified = await adapter.verifyAccessToken(token);
    expect(verified.sub).toBe(samplePayload.sub);
    expect(verified.clinicId).toBe(samplePayload.clinicId);
    expect(verified.role).toBe(samplePayload.role);
    expect(verified.email).toBe(samplePayload.email);
  });

  it('debe fallar al verificar un token con firma inválida', async () => {
    const token = await adapter.signAccessToken(samplePayload);
    const tampered = token.slice(0, -5) + 'abcde';

    await expect(adapter.verifyAccessToken(tampered)).rejects.toThrow();
  });

  it('debe generar un refresh token aleatorio con su hash y fecha de expiración', () => {
    const data1 = adapter.generateRefreshToken();
    const data2 = adapter.generateRefreshToken();

    expect(data1.token).toHaveLength(64);
    expect(data2.token).toHaveLength(64);
    expect(data1.token).not.toBe(data2.token);

    expect(data1.tokenHash).toHaveLength(64);
    expect(data1.tokenHash).toBe(adapter.hashRefreshToken(data1.token));

    expect(data1.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('debe calcular el hash SHA-256 de forma determinista para el refresh token', () => {
    const rawToken = 'my-super-secret-refresh-token';
    const hash1 = adapter.hashRefreshToken(rawToken);
    const hash2 = adapter.hashRefreshToken(rawToken);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });
});
