import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import pino, { Logger } from 'pino';

import { createLoggerConfig } from './logger.config';

@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly logger: Logger;

  constructor(private readonly configService: ConfigService) {
    const nodeEnv = this.configService.get<string>('nodeEnv', 'development');
    const logLevel = this.configService.get<string>('logLevel', 'info');
    const config = createLoggerConfig(nodeEnv, logLevel);
    this.logger = pino(config);
  }

  log(message: string, context?: string): void {
    this.logger.info({ context }, message);
  }

  error(message: string, trace?: string, context?: string): void {
    this.logger.error({ context, trace }, message);
  }

  warn(message: string, context?: string): void {
    this.logger.warn({ context }, message);
  }

  debug(message: string, context?: string): void {
    this.logger.debug({ context }, message);
  }

  verbose(message: string, context?: string): void {
    this.logger.trace({ context }, message);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.logger.info(meta, message);
  }

  fatal(message: string, meta?: Record<string, unknown>): void {
    this.logger.fatal(meta, message);
  }

  child(bindings: Record<string, unknown>): Logger {
    return this.logger.child(bindings);
  }

  logHttpRequest(req: unknown, res: unknown, duration: number): void {
    const request = req as {
      method?: string;
      url?: string;
      headers?: Record<string, unknown>;
      ip?: string;
    };
    const response = res as { statusCode?: number };

    this.logger.info(
      {
        type: 'http_request',
        method: request.method,
        url: request.url,
        statusCode: response.statusCode,
        duration,
        userAgent: request.headers?.['user-agent'] as string | undefined,
        ip: request.ip,
      },
      'HTTP Request',
    );
  }

  logDomainEvent(eventName: string, aggregateId: string, metadata?: Record<string, unknown>): void {
    this.logger.info(
      {
        type: 'domain_event',
        eventName,
        aggregateId,
        ...metadata,
      },
      `Domain Event: ${eventName}`,
    );
  }

  logError(error: Error, context?: string, metadata?: Record<string, unknown>): void {
    this.logger.error(
      {
        context,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        ...metadata,
      },
      `Error: ${error.message}`,
    );
  }

  logPerformance(operation: string, duration: number, metadata?: Record<string, unknown>): void {
    this.logger.info(
      {
        type: 'performance',
        operation,
        duration,
        ...metadata,
      },
      `Performance: ${operation} took ${duration}ms`,
    );
  }
}
