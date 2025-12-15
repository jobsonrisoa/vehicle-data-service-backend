/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/require-await */
import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import { INestApplication } from '@nestjs/common';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { StartedRabbitMQContainer } from '@testcontainers/rabbitmq';
import { DataSource } from 'typeorm';

export interface VehicleTestContext {
  app: INestApplication;
  postgresContainer: StartedPostgreSqlContainer;
  rabbitmqContainer: StartedRabbitMQContainer;
  dataSource: DataSource;
  response?: any;
  graphqlResponse?: any;
  currentJobId?: string;
  currentCursor?: string;
  capturedData?: any;
  error?: any;
  metadata?: Map<string, unknown>;
}

export interface GraphQLResponse {
  status: number;
  body: {
    data?: Record<string, unknown>;
    errors?: Array<{ message: string }>;
  };
}

export class VehicleWorld extends World {
  public context!: VehicleTestContext;

  constructor(options: IWorldOptions) {
    super(options);
  }

  async setTestContext(context: VehicleTestContext): Promise<void> {
    this.context = context;
    if (!this.context.capturedData) {
      this.context.capturedData = {};
    }
    if (!this.context.metadata) {
      (this.context as any).metadata = new Map<string, unknown>();
    }
  }

  getApp(): INestApplication {
    return this.context.app;
  }

  getDataSource(): DataSource {
    return this.context.dataSource;
  }

  setResponse(response: any): void {
    this.context.response = response;
  }

  getResponse(): any {
    return this.context.response;
  }

  setGraphQLResponse(response: any): void {
    this.context.graphqlResponse = response;
  }

  getGraphQLResponse(): any {
    return this.context.graphqlResponse;
  }

  setJobId(jobId: string): void {
    this.context.currentJobId = jobId;
  }

  getJobId(): string | undefined {
    return this.context.currentJobId;
  }

  setCursor(cursor: string): void {
    this.context.currentCursor = cursor;
  }

  getCursor(): string | undefined {
    return this.context.currentCursor;
  }

  captureData(key: string, value: any): void {
    if (!this.context.capturedData) {
      this.context.capturedData = {};
    }
    this.context.capturedData[key] = value;
  }

  getCapturedData(key: string): any {
    return this.context.capturedData?.[key];
  }

  setContext(key: string, value: unknown): void {
    const metadata = (this.context as any).metadata ?? new Map<string, unknown>();
    metadata.set(key, value);
    (this.context as any).metadata = metadata;
  }

  getContext<T>(key: string): T | undefined {
    const metadata = (this.context as any).metadata as Map<string, unknown> | undefined;
    return metadata?.get(key) as T | undefined;
  }

  clearContext(): void {
    const metadata = (this.context as any).metadata as Map<string, unknown> | undefined;
    metadata?.clear();
  }

  setError(error: any): void {
    this.context.error = error;
  }

  getError(): any {
    return this.context.error;
  }
}

setWorldConstructor(VehicleWorld);
