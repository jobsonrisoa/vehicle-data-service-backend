import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { LoggerService } from '@infrastructure/logging/logger.service';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = app.get(LoggerService);
  app.useLogger(logger);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('port', 3000);
  const nodeEnv = configService.get<string>('nodeEnv', 'development');

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Vehicle Data Aggregation API')
    .setDescription(
      'REST API for vehicle data ingestion and monitoring. Provides endpoints for ingestion management and health checks.'
    )
    .setVersion('1.0')
    .addTag('health', 'Health check endpoints')
    .addTag('ingestion', 'Ingestion management endpoints')
    .addServer(`http://localhost:${port}`, 'Local')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });

  logger.log(`Starting application in ${nodeEnv} mode`, 'Bootstrap');
  logger.log('Configuration validated successfully', 'Bootstrap');

  await app.listen(port);
  logger.log(`Application listening on port ${port}`, 'Bootstrap');
}
void bootstrap();
