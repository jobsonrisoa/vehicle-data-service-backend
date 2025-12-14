import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { ConfigModule } from './infrastructure/config/config.module';
import { HttpLoggerMiddleware } from './infrastructure/logging/http-logger.middleware';
import { LoggerModule } from './infrastructure/logging/logger.module';
import { DatabaseModule } from './infrastructure/adapters/secondary/persistence/database.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RestModule } from './infrastructure/adapters/primary/rest/rest.module';

@Module({
  imports: [ConfigModule, LoggerModule, DatabaseModule, RestModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(HttpLoggerMiddleware).forRoutes('*');
  }
}
