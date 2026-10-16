import { SystemClockAdapter } from './system-clock.adapter';

describe('SystemClockAdapter', () => {
  let clock: SystemClockAdapter;

  beforeEach(() => {
    clock = new SystemClockAdapter();
  });

  it('debe retornar una fecha válida en now()', () => {
    const before = Date.now();
    const now = clock.now();
    const after = Date.now();

    expect(now).toBeInstanceOf(Date);
    expect(now.getTime()).toBeGreaterThanOrEqual(before);
    expect(now.getTime()).toBeLessThanOrEqual(after);
  });

  it('debe formatear correctamente la fecha en zona horaria America/Bogota', () => {
    // 2026-10-14 03:30 UTC -> 2026-10-13 22:30 en Bogotá
    const date = new Date('2026-10-14T03:30:00.000Z');
    expect(clock.formatInBogota(date)).toBe('2026-10-13');
  });

  it('debe evaluar correctamente el borde a las 23:59 en America/Bogota', () => {
    // 2026-10-14 04:59 UTC -> 2026-10-13 23:59 en Bogotá
    const dateAtNight = new Date('2026-10-14T04:59:00.000Z');
    expect(clock.formatInBogota(dateAtNight)).toBe('2026-10-13');
  });

  it('debe evaluar correctamente el borde a las 00:01 en America/Bogota', () => {
    // 2026-10-14 05:01 UTC -> 2026-10-14 00:01 en Bogotá
    const dateNextDay = new Date('2026-10-14T05:01:00.000Z');
    expect(clock.formatInBogota(dateNextDay)).toBe('2026-10-14');
  });

  it('debe comparar si dos instantes corresponden al mismo día en America/Bogota', () => {
    const afternoon = new Date('2026-10-13T15:00:00.000Z'); // 10:00 en Bogotá
    const night = new Date('2026-10-14T03:30:00.000Z'); // 22:30 en Bogotá (mismo día)
    const nextDayMorning = new Date('2026-10-14T05:01:00.000Z'); // 00:01 en Bogotá (día siguiente)

    expect(clock.isSameDayInBogota(afternoon, night)).toBe(true);
    expect(clock.isSameDayInBogota(night, nextDayMorning)).toBe(false);
  });

  it('debe retornar todayInBogota en formato YYYY-MM-DD', () => {
    const today = clock.todayInBogota();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('debe formatear fecha y hora en formato YYYY-MM-DD HH:mm en America/Bogota', () => {
    // 2026-10-14 03:30 UTC -> 2026-10-13 22:30 en Bogotá
    const night = new Date('2026-10-14T03:30:00.000Z');
    expect(clock.formatDateTimeInBogota(night)).toBe('2026-10-13 22:30');

    // 2026-10-14 17:35 UTC -> 2026-10-14 12:35 en Bogotá
    const afternoon = new Date('2026-10-14T17:35:00.000Z');
    expect(clock.formatDateTimeInBogota(afternoon)).toBe('2026-10-14 12:35');

    // 2026-10-14 05:00 UTC -> 2026-10-14 00:00 en Bogotá
    const midnight = new Date('2026-10-14T05:00:00.000Z');
    expect(clock.formatDateTimeInBogota(midnight)).toBe('2026-10-14 00:00');
  });
});
