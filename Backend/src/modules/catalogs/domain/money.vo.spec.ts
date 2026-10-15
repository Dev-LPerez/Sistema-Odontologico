import { Money } from './money.vo';
import { InvalidMoneyAmountError } from './catalogs.errors';

describe('Money Value Object', () => {
  it('debe crear una instancia válida de Money con monto entero positivo', () => {
    const money = Money.from(180000);
    expect(money.amount).toBe(180000);
    expect(money.isZero()).toBe(false);
  });

  it('debe permitir crear Money con valor cero', () => {
    const money = Money.zero();
    expect(money.amount).toBe(0);
    expect(money.isZero()).toBe(true);
  });

  it('debe lanzar InvalidMoneyAmountError cuando el monto es negativo', () => {
    expect(() => Money.from(-100)).toThrow(InvalidMoneyAmountError);
  });

  it('debe lanzar InvalidMoneyAmountError cuando el monto no es un número entero', () => {
    expect(() => Money.from(15000.5)).toThrow(InvalidMoneyAmountError);
  });

  it('debe lanzar InvalidMoneyAmountError cuando el valor no es un número finito válido', () => {
    expect(() => Money.from(NaN)).toThrow(InvalidMoneyAmountError);
    expect(() => Money.from(Infinity)).toThrow(InvalidMoneyAmountError);
  });

  it('debe comparar igualdad por valor correctamente', () => {
    const m1 = Money.from(150000);
    const m2 = Money.from(150000);
    const m3 = Money.from(200000);

    expect(m1.equals(m2)).toBe(true);
    expect(m1.equals(m3)).toBe(false);
  });

  it('debe retornar false al comparar con null, undefined o instancias que no sean Money', () => {
    const money = Money.from(150000);
    expect(money.equals(null as unknown as Money)).toBe(false);
    expect(money.equals(undefined as unknown as Money)).toBe(false);
    expect(money.equals({ amount: 150000 } as unknown as Money)).toBe(false);
  });
});
