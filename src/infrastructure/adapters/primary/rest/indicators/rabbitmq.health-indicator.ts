import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthCheckError, HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import * as amqplib from 'amqplib';

@Injectable()
export class RabbitMQHealthIndicator extends HealthIndicator {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  async pingCheck(key: string): Promise<HealthIndicatorResult> {
    const url = this.configService.get<string>('RABBITMQ_URL');
    try {
      const connection = await amqplib.connect(url as string);
      await connection.close();
      return this.getStatus(key, true);
    } catch (error) {
      const result = this.getStatus(key, false, { message: (error as Error).message });
      throw new HealthCheckError('RabbitMQ check failed', result);
    }
  }
}

