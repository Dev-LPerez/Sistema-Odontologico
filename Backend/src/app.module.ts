import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { HealthModule } from './health/health.module';
import { IdentityModule } from './modules/identity';
import { PatientsModule } from './modules/patients';
import { SharedModule, CorrelationIdMiddleware, createPinoHttpConfig } from './shared';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: createPinoHttpConfig(),
    }),
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.THROTTLE_TTL || 60000),
        limit: Number(process.env.THROTTLE_LIMIT || 100),
      },
    ]),
    SharedModule,
    IdentityModule,
    PatientsModule,
    HealthModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
