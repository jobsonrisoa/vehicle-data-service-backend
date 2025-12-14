import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@infrastructure/logging/logger.service';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = app.get(LoggerService);
  app.useLogger(logger);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('port', 3000);
  const nodeEnv = configService.get<string>('nodeEnv', 'development');

  logger.log(`Starting application in ${nodeEnv} mode`, 'Bootstrap');
  logger.log('Configuration validated successfully', 'Bootstrap');

  await app.listen(port);
  logger.log(`Application listening on port ${port}`, 'Bootstrap');
}
void bootstrap();
