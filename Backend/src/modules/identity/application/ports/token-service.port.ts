export interface JwtAccessTokenPayload {
  sub: string;
  clinicId: string;
  email: string;
  role: string;
}

export interface GeneratedRefreshToken {
  token: string;
  tokenHash: string;
  expiresAt: Date;
}

export const TOKEN_SERVICE_PORT = Symbol('TOKEN_SERVICE_PORT');

export interface TokenServicePort {
  signAccessToken(payload: JwtAccessTokenPayload): Promise<string>;
  verifyAccessToken(token: string): Promise<JwtAccessTokenPayload>;
  generateRefreshToken(): GeneratedRefreshToken;
  hashRefreshToken(token: string): string;
}
