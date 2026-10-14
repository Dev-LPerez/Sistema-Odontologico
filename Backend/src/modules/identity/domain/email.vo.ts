import { InvalidEmailError } from './identity.errors';

export class Email {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private constructor(readonly value: string) {}

  static create(raw: string): Email {
    if (!raw) {
      throw new InvalidEmailError(raw);
    }

    const normalized = raw.trim().toLowerCase();
    if (!Email.EMAIL_REGEX.test(normalized)) {
      throw new InvalidEmailError(raw);
    }

    return new Email(normalized);
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
