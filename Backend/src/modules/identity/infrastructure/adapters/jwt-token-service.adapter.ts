import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import {
  GeneratedRefreshToken,
  JwtAccessTokenPayload,
  TokenServicePort,
} from '../../application/ports/token-service.port';

@Injectable()
export class JwtTokenServiceAdapter implements TokenServicePort {
  constructor(private readonly jwtService: JwtService) {}

  async signAccessToken(payload: JwtAccessTokenPayload): Promise<string> {
    return this.jwtService.signAsync(payload);
  }

  async verifyAccessToken(token: string): Promise<JwtAccessTokenPayload> {
    return this.jwtService.verifyAsync<JwtAccessTokenPayload>(token);
  }

  generateRefreshToken(): GeneratedRefreshToken {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashRefreshToken(token);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días

    return {
      token,
      tokenHash,
      expiresAt,
    };
  }

  hashRefreshToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
