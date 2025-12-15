import { Global, Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';

import { LoggerService } from './logger.service';

@Global()
@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
        level: process.env.LOG_LEVEL || 'info',
      },
    }),
  ],
  providers: [LoggerService],
  exports: [LoggerService, PinoLoggerModule],
})
export class LoggerModule {}
