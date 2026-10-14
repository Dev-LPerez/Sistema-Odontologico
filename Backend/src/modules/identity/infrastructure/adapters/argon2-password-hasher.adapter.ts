import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PasswordHasherPort } from '../../application/ports/password-hasher.port';

@Injectable()
export class Argon2PasswordHasherAdapter implements PasswordHasherPort {
  async hash(plainText: string): Promise<string> {
    return argon2.hash(plainText, {
      type: argon2.argon2id,
    });
  }

  async verify(plainText: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plainText);
    } catch {
      return false;
    }
  }
}
