import { Injectable } from '@nestjs/common';
import { ClockPort } from '../../application/ports/clock.port';

@Injectable()
export class SystemClockAdapter implements ClockPort {
  private readonly formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  private readonly dateTimeFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    hourCycle: 'h23',
  });

  now(): Date {
    return new Date();
  }

  todayInBogota(): string {
    return this.formatInBogota(this.now());
  }

  formatInBogota(date: Date): string {
    return this.formatter.format(date);
  }

  formatDateTimeInBogota(date: Date): string {
    return this.dateTimeFormatter.format(date).replace(', ', ' ');
  }

  isSameDayInBogota(date1: Date, date2: Date): boolean {
    return this.formatInBogota(date1) === this.formatInBogota(date2);
  }
}
