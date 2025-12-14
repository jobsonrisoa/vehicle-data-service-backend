import { Test } from '@nestjs/testing';
import { HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';

import { HealthController } from '@infrastructure/adapters/primary/rest/controllers/health.controller';
import { RabbitMQHealthIndicator } from '@infrastructure/adapters/primary/rest/indicators/rabbitmq.health-indicator';

describe('HealthController', () => {
  let controller: HealthController;
  let healthService: jest.Mocked<HealthCheckService>;

  beforeEach(async () => {
    healthService = {
      check: jest.fn(),
    } as any;

    const db = {
      pingCheck: jest.fn(),
    } as any;

    const rmq = {
      pingCheck: jest.fn(),
    } as any;

    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: healthService,
        },
        {
          provide: TypeOrmHealthIndicator,
          useValue: db,
        },
        {
          provide: RabbitMQHealthIndicator,
          useValue: rmq,
        },
      ],
    }).compile();

    controller = moduleRef.get(HealthController);
  });

  it('returns health status with dependency checks', async () => {
    const result = { status: 'ok', info: {}, error: {}, details: {} };
    healthService.check.mockResolvedValue(result as any);

    const response = await controller.check();

    expect(response).toEqual(result);
    expect(healthService.check).toHaveBeenCalled();
  });

  it('propagates health errors', async () => {
    const result = { status: 'error', info: {}, error: { db: {} }, details: { db: {} } };
    healthService.check.mockResolvedValue(result as any);

    const response = await controller.check();

    expect(response.status).toBe('error');
  });

  it('returns ok for liveness', () => {
    expect(controller.liveness()).toEqual({ status: 'ok' });
  });

  it('returns readiness status', async () => {
    const result = { status: 'ok', info: {}, error: {}, details: {} };
    healthService.check.mockResolvedValue(result as any);

    const response = await controller.readiness();

    expect(response.status).toBe('ok');
    expect(healthService.check).toHaveBeenCalled();
  });
});

