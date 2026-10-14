import { Global, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from './prisma/prisma.module';
import { CLOCK_PORT } from '../application/ports/clock.port';
import { ID_GENERATOR_PORT } from '../application/ports/id-generator.port';
import { UNIT_OF_WORK_PORT } from '../application/ports/unit-of-work.port';
import { EVENT_BUS_PORT } from '../application/ports/event-bus.port';
import { SystemClockAdapter } from './adapters/system-clock.adapter';
import { UuidGeneratorAdapter } from './adapters/uuid-generator.adapter';
import { PrismaUnitOfWorkAdapter } from './adapters/prisma-unit-of-work.adapter';
import { NestEventBusAdapter } from './adapters/nest-event-bus.adapter';

@Global()
@Module({
  imports: [PrismaModule, EventEmitterModule.forRoot()],
  providers: [
    { provide: CLOCK_PORT, useClass: SystemClockAdapter },
    { provide: ID_GENERATOR_PORT, useClass: UuidGeneratorAdapter },
    { provide: UNIT_OF_WORK_PORT, useClass: PrismaUnitOfWorkAdapter },
    { provide: EVENT_BUS_PORT, useClass: NestEventBusAdapter },
    SystemClockAdapter,
    UuidGeneratorAdapter,
    PrismaUnitOfWorkAdapter,
    NestEventBusAdapter,
  ],
  exports: [
    CLOCK_PORT,
    ID_GENERATOR_PORT,
    UNIT_OF_WORK_PORT,
    EVENT_BUS_PORT,
    PrismaModule,
    SystemClockAdapter,
    UuidGeneratorAdapter,
    PrismaUnitOfWorkAdapter,
    NestEventBusAdapter,
  ],
})
export class SharedModule {}
