import { InvalidAvailabilityConfigurationException } from './scheduling.errors';
import { TimeSlot } from './time-slot.vo';

export interface AvailabilitySlotItem {
  dayOfWeek: number; // 1 (Monday) to 7 (Sunday)
  startTime: string; // "HH:MM" e.g. "09:00"
  endTime: string; // "HH:MM" e.g. "18:00"
}

export interface WeeklyAvailabilityProps {
  clinicId: string;
  slots: AvailabilitySlotItem[];
  maxDailyAppointments?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class WeeklyAvailability {
  readonly clinicId: string;
  private _slots: AvailabilitySlotItem[];
  private _maxDailyAppointments: number;
  readonly createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    clinicId: string,
    slots: AvailabilitySlotItem[],
    maxDailyAppointments: number,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.clinicId = clinicId;
    this._slots = slots;
    this._maxDailyAppointments = maxDailyAppointments;
    this.createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  static create(props: WeeklyAvailabilityProps): WeeklyAvailability {
    WeeklyAvailability.validate(props);
    const now = new Date();
    return new WeeklyAvailability(
      props.clinicId.trim(),
      [...props.slots],
      props.maxDailyAppointments ?? 4,
      props.createdAt ?? now,
      props.updatedAt ?? now,
    );
  }

  static reconstitute(props: Required<WeeklyAvailabilityProps>): WeeklyAvailability {
    return new WeeklyAvailability(
      props.clinicId,
      [...props.slots],
      props.maxDailyAppointments,
      props.createdAt,
      props.updatedAt,
    );
  }

  get slots(): AvailabilitySlotItem[] {
    return [...this._slots];
  }

  get maxDailyAppointments(): number {
    return this._maxDailyAppointments;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  update(slots: AvailabilitySlotItem[], maxDailyAppointments: number, updatedAt: Date): void {
    WeeklyAvailability.validate({
      clinicId: this.clinicId,
      slots,
      maxDailyAppointments,
    });
    this._slots = [...slots];
    this._maxDailyAppointments = maxDailyAppointments;
    this._updatedAt = updatedAt;
  }

  isAvailableFor(timeSlot: TimeSlot): boolean {
    const day = timeSlot.getBogotaDayOfWeek();
    const daySlots = this._slots.filter((s) => s.dayOfWeek === day);
    if (daySlots.length === 0) {
      return false;
    }

    return daySlots.some((slot) =>
      timeSlot.isWithinAvailability(day, slot.startTime, slot.endTime),
    );
  }

  private static validate(props: WeeklyAvailabilityProps): void {
    WeeklyAvailability.validateClinicAndLimit(props.clinicId, props.maxDailyAppointments);
    if (!Array.isArray(props.slots)) {
      throw new InvalidAvailabilityConfigurationException(
        'Las franjas de disponibilidad deben ser una lista',
      );
    }
    for (const slot of props.slots) {
      WeeklyAvailability.validateSlotItem(slot);
    }
  }

  private static validateClinicAndLimit(clinicId?: string, maxDailyAppointments?: number): void {
    if (!clinicId || clinicId.trim().length === 0) {
      throw new InvalidAvailabilityConfigurationException(
        'El identificador del consultorio es obligatorio',
      );
    }

    const maxAppointments = maxDailyAppointments ?? 4;
    if (!Number.isInteger(maxAppointments) || maxAppointments < 1 || maxAppointments > 10) {
      throw new InvalidAvailabilityConfigurationException(
        'El tope máximo de citas diarias debe ser un número entero entre 1 y 10',
      );
    }
  }

  private static validateSlotItem(slot: AvailabilitySlotItem): void {
    WeeklyAvailability.validateSlotDay(slot.dayOfWeek);
    WeeklyAvailability.validateSlotTimes(slot.startTime, slot.endTime);
  }

  private static validateSlotDay(dayOfWeek: number): void {
    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 7) {
      throw new InvalidAvailabilityConfigurationException(
        'El día de la semana debe ser un entero entre 1 (Lunes) y 7 (Domingo)',
      );
    }
  }

  private static validateSlotTimes(startTime?: string, endTime?: string): void {
    if (!startTime || !endTime) {
      throw new InvalidAvailabilityConfigurationException(
        'La hora de inicio y fin son obligatorias',
      );
    }

    const [startH, startM] = startTime.split(':').map((s) => parseInt(s, 10));
    const [endH, endM] = endTime.split(':').map((s) => parseInt(s, 10));

    if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) {
      throw new InvalidAvailabilityConfigurationException('Formato de hora inválido, use HH:MM');
    }

    if (startH < 9) {
      throw new InvalidAvailabilityConfigurationException(
        'La hora de inicio no puede ser anterior a las 09:00 a. m. (RF-B-061)',
      );
    }

    if (endH * 60 + endM <= startH * 60 + startM) {
      throw new InvalidAvailabilityConfigurationException(
        'La hora de fin debe ser posterior a la hora de inicio',
      );
    }
  }
}
