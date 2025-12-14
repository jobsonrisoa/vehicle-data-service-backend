import { World as CucumberWorld, setWorldConstructor, IWorldOptions } from '@cucumber/cucumber';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface TestWorld extends CucumberWorld {
  app: INestApplication | null;
  dataSource: DataSource | null;
  response: unknown;
  error: Error | null;
  context: Map<string, unknown>;
}

export class CustomWorld extends CucumberWorld implements TestWorld {
  app: INestApplication | null = null;
  dataSource: DataSource | null = null;
  response: unknown = null;
  error: Error | null = null;
  context: Map<string, unknown> = new Map();

  constructor(options: IWorldOptions) {
    super(options);
  }

  setContext(key: string, value: unknown): void {
    this.context.set(key, value);
  }

  getContext<T>(key: string): T | undefined {
    return this.context.get(key) as T | undefined;
  }

  clearContext(): void {
    this.context.clear();
  }
}

setWorldConstructor(CustomWorld);
