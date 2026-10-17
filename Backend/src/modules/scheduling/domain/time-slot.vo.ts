import { InvalidTimeSlotError } from './scheduling.errors';

const BOGOTA_TIMEZONE = 'America/Bogota';

export interface BogotaTime {
  hour: number;
  minute: number;
}

export class TimeSlot {
  readonly startTime: Date;
  readonly endTime: Date;
  readonly durationMinutes: number;

  private constructor(startTime: Date, endTime: Date, durationMinutes: number) {
    this.startTime = startTime;
    this.endTime = endTime;
    this.durationMinutes = durationMinutes;
    Object.freeze(this);
  }

  static create(startTime: Date, durationMinutes: number): TimeSlot {
    if (!startTime || !(startTime instanceof Date) || isNaN(startTime.getTime())) {
      throw new InvalidTimeSlotError(
        'La fecha y hora de inicio de la cita debe ser una fecha válida',
      );
    }

    if (!Number.isInteger(durationMinutes) || durationMinutes < 15) {
      throw new InvalidTimeSlotError(
        'La duración de la cita debe ser un número entero mayor o igual a 15 minutos',
      );
    }

    if (durationMinutes > 480) {
      throw new InvalidTimeSlotError(
        'La duración de la cita no puede exceder las 8 horas (480 minutos)',
      );
    }

    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
    return new TimeSlot(new Date(startTime.getTime()), endTime, durationMinutes);
  }

  static fromRange(startTime: Date, endTime: Date): TimeSlot {
    if (!startTime || !(startTime instanceof Date) || isNaN(startTime.getTime())) {
      throw new InvalidTimeSlotError('La fecha de inicio debe ser válida');
    }
    if (!endTime || !(endTime instanceof Date) || isNaN(endTime.getTime())) {
      throw new InvalidTimeSlotError('La fecha de fin debe ser válida');
    }
    if (endTime.getTime() <= startTime.getTime()) {
      throw new InvalidTimeSlotError('La fecha de fin debe ser posterior a la fecha de inicio');
    }
    const diffMs = endTime.getTime() - startTime.getTime();
    const durationMinutes = Math.round(diffMs / (60 * 1000));
    return TimeSlot.create(startTime, durationMinutes);
  }

  overlapsWith(other: TimeSlot): boolean {
    return (
      this.startTime.getTime() < other.endTime.getTime() &&
      this.endTime.getTime() > other.startTime.getTime()
    );
  }

  getBogotaTime(): BogotaTime {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: BOGOTA_TIMEZONE,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });
    const parts = formatter.formatToParts(this.startTime);
    const hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
    const minute = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
    return { hour, minute };
  }

  getBogotaDateString(): string {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: BOGOTA_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(this.startTime);
  }

  getBogotaDayOfWeek(): number {
    // en-US weekday short: Mon, Tue, Wed, Thu, Fri, Sat, Sun
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: BOGOTA_TIMEZONE,
      weekday: 'short',
    });
    const weekday = formatter.format(this.startTime);
    switch (weekday) {
      case 'Mon':
        return 1;
      case 'Tue':
        return 2;
      case 'Wed':
        return 3;
      case 'Thu':
        return 4;
      case 'Fri':
        return 5;
      case 'Sat':
        return 6;
      case 'Sun':
        return 7;
      default:
        return 1;
    }
  }

  isWithinAvailability(dayOfWeek: number, startTimeStr: string, endTimeStr: string): boolean {
    if (this.getBogotaDayOfWeek() !== dayOfWeek) {
      return false;
    }

    const [availStartHour, availStartMin] = startTimeStr.split(':').map((s) => parseInt(s, 10));
    const [availEndHour, availEndMin] = endTimeStr.split(':').map((s) => parseInt(s, 10));

    const availStartMinutes = availStartHour * 60 + availStartMin;
    const availEndMinutes = availEndHour * 60 + availEndMin;

    const startBogota = this.getBogotaTime();
    const slotStartMinutes = startBogota.hour * 60 + startBogota.minute;
    const slotEndMinutes = slotStartMinutes + this.durationMinutes;

    return slotStartMinutes >= availStartMinutes && slotEndMinutes <= availEndMinutes;
  }
}
