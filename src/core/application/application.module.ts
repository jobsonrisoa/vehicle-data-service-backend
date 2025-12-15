import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PinoLogger } from 'nestjs-pino';

import { VehicleQueryService } from './services/vehicle-query.service';
import { IngestDataService } from './services/ingest-data.service';
import { GetAllVehicleMakesUseCase } from './use-cases/get-all-vehicle-makes.use-case';
import { GetVehicleMakeByIdUseCase } from './use-cases/get-vehicle-make-by-id.use-case';
import { IngestVehicleDataUseCase } from './use-cases/ingest-vehicle-data.use-case';
import { TransformXmlToJsonUseCase } from './use-cases/transform-xml-to-json.use-case';

import { VehicleMakeRepository } from '@infrastructure/adapters/secondary/persistence/repositories/vehicle-make.repository';
import { IngestionJobRepository } from '@infrastructure/adapters/secondary/persistence/repositories/ingestion-job.repository';
import { NhtsaApiClient } from '@infrastructure/adapters/secondary/external-api/nhtsa/nhtsa-api.client';
import { XmlParserService } from '@infrastructure/adapters/secondary/external-api/xml-parser/xml-parser.service';
import { RabbitMQModule } from '@infrastructure/adapters/secondary/messaging/rabbitmq.module';
import { DatabaseModule } from '@infrastructure/adapters/secondary/persistence/database.module';

@Module({
  imports: [ConfigModule, DatabaseModule, RabbitMQModule],
  providers: [
    // Repositories
    VehicleMakeRepository,
    {
      provide: 'IVehicleMakeRepository',
      useExisting: VehicleMakeRepository,
    },
    IngestionJobRepository,
    {
      provide: 'IIngestionJobRepository',
      useExisting: IngestionJobRepository,
    },

    // External API
    XmlParserService,
    {
      provide: 'IExternalVehicleAPIPort',
      inject: [ConfigService, XmlParserService, PinoLogger],
      useFactory: (
        configService: ConfigService,
        xmlParser: XmlParserService,
        logger: PinoLogger,
      ) => {
        const baseUrl =
          configService.get<string>('NHTSA_API_BASE_URL') || 'https://vpic.nhtsa.dot.gov/api';
        const timeout = configService.get<number>('NHTSA_API_TIMEOUT') || 30000;
        const httpClient = axios.create({ baseURL: baseUrl, timeout });
        return new NhtsaApiClient(httpClient, xmlParser, logger);
      },
    },

    // Use Cases
    {
      provide: GetAllVehicleMakesUseCase,
      inject: ['IVehicleMakeRepository'],
      useFactory: (repo: any) => new GetAllVehicleMakesUseCase(repo),
    },
    {
      provide: GetVehicleMakeByIdUseCase,
      inject: ['IVehicleMakeRepository'],
      useFactory: (repo: any) => new GetVehicleMakeByIdUseCase(repo),
    },
    TransformXmlToJsonUseCase,
    {
      provide: IngestVehicleDataUseCase,
      inject: [
        'IVehicleMakeRepository',
        'IIngestionJobRepository',
        'IExternalVehicleAPIPort',
        'IEventPublisherPort',
        TransformXmlToJsonUseCase,
      ],
      useFactory: (
        vehicleRepo: any,
        jobRepo: any,
        externalApi: any,
        eventPublisher: any,
        transformUseCase: TransformXmlToJsonUseCase,
      ) =>
        new IngestVehicleDataUseCase(
          vehicleRepo,
          jobRepo,
          externalApi,
          eventPublisher,
          transformUseCase,
        ),
    },

    // Port implementations
    {
      provide: VehicleQueryService,
      inject: ['IVehicleMakeRepository'],
      useFactory: (repo: any) => new VehicleQueryService(repo),
    },
    {
      provide: 'IQueryVehiclesPort',
      useExisting: VehicleQueryService,
    },
    {
      provide: IngestDataService,
      inject: ['IIngestionJobRepository', IngestVehicleDataUseCase],
      useFactory: (jobRepo: any, ingestUseCase: IngestVehicleDataUseCase) =>
        new IngestDataService(jobRepo, ingestUseCase),
    },
    {
      provide: 'IIngestDataPort',
      useExisting: IngestDataService,
    },
  ],
  exports: [
    'IQueryVehiclesPort',
    'IIngestDataPort',
    'IVehicleMakeRepository',
    'IIngestionJobRepository',
    VehicleMakeRepository,
    IngestionJobRepository,
  ],
})
export class ApplicationModule {}
