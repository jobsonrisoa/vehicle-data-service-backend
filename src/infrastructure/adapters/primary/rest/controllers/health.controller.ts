import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiResponse, ApiTags, ApiOperation } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, HealthCheckResult, TypeOrmHealthIndicator } from '@nestjs/terminus';

import { RabbitMQHealthIndicator } from '../indicators/rabbitmq.health-indicator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly rmq: RabbitMQHealthIndicator
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Comprehensive health check' })
  @ApiOkResponse({ description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.rmq.pingCheck('rabbitmq'),
    ]);
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiOkResponse({ description: 'Application is alive' })
  liveness(): { status: string } {
    return { status: 'ok' };
  }

  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe' })
  @ApiOkResponse({ description: 'Application is ready' })
  @ApiResponse({ status: 503, description: 'Application is not ready' })
  readiness(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.rmq.pingCheck('rabbitmq'),
    ]);
  }
}

