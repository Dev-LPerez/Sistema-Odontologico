import { InvalidMoneyAmountError } from './catalogs.errors';

export class Money {
  private constructor(readonly amount: number) {}

  static from(amount: number): Money {
    if (
      typeof amount !== 'number' ||
      !Number.isFinite(amount) ||
      !Number.isInteger(amount) ||
      amount < 0
    ) {
      throw new InvalidMoneyAmountError();
    }
    return new Money(amount);
  }

  static zero(): Money {
    return new Money(0);
  }

  isZero(): boolean {
    return this.amount === 0;
  }

  equals(other: Money): boolean {
    if (!other || !(other instanceof Money)) {
      return false;
    }
    return this.amount === other.amount;
  }
}
