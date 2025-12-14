import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { LoggerService } from '@infrastructure/logging/logger.service';

describe('LoggerService (Unit)', () => {
  let loggerService: LoggerService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        LoggerService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, defaultValue?: unknown) => {
              const config: Record<string, unknown> = {
                nodeEnv: 'test',
                logLevel: 'error',
              };
              return config[key] ?? defaultValue;
            },
          },
        },
      ],
    }).compile();

    loggerService = module.get<LoggerService>(LoggerService);
  });

  it('should be defined', () => {
    expect(loggerService).toBeDefined();
  });

  it('should log info messages', () => {
    expect(() => {
      loggerService.info('Test message', { key: 'value' });
    }).not.toThrow();
  });

  it('should log errors with context', () => {
    const error = new Error('Test error');
    expect(() => {
      loggerService.logError(error, 'TestContext', { extra: 'data' });
    }).not.toThrow();
  });

  it('should log domain events', () => {
    expect(() => {
      loggerService.logDomainEvent('VehicleMakeCreated', 'make-123', {
        makeName: 'ASTON MARTIN',
      });
    }).not.toThrow();
  });

  it('should log performance metrics', () => {
    expect(() => {
      loggerService.logPerformance('database-query', 125, {
        query: 'SELECT * FROM vehicle_makes',
      });
    }).not.toThrow();
  });
});
