export const CLOCK_PORT = Symbol('CLOCK_PORT');

export interface ClockPort {
  now(): Date;
  todayInBogota(): string;
  formatInBogota(date: Date): string;
  formatDateTimeInBogota(date: Date): string;
  isSameDayInBogota(date1: Date, date2: Date): boolean;
}
