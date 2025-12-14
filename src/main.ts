import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  const port = configService.get<number>('port', 3000);
  const nodeEnv = configService.get<string>('nodeEnv', 'development');

  logger.log(`Starting application in ${nodeEnv} mode`);
  logger.log('Configuration validated successfully');

  await app.listen(port);
  logger.log(`Application listening on port ${port}`);
}
void bootstrap();
