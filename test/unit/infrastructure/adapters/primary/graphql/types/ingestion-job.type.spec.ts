import 'reflect-metadata';

import { IngestionJobType, IngestionStatusEnum } from '@infrastructure/adapters/primary/graphql/types/ingestion-job.type';

describe('IngestionJobType', () => {
  it('sets field design types', () => {
    expect(Reflect.getMetadata('design:type', IngestionJobType.prototype, 'id')).toBe(String);
    expect(Reflect.getMetadata('design:type', IngestionJobType.prototype, 'status')).toBe(String);
    expect(Reflect.getMetadata('design:type', IngestionJobType.prototype, 'startedAt')).toBe(Date);
    expect(Reflect.getMetadata('design:type', IngestionJobType.prototype, 'completedAt')).toBe(Date);
    expect(Reflect.getMetadata('design:type', IngestionJobType.prototype, 'totalMakes')).toBe(Number);
    expect(Reflect.getMetadata('design:type', IngestionJobType.prototype, 'processedMakes')).toBe(Number);
    expect(Reflect.getMetadata('design:type', IngestionJobType.prototype, 'failedMakes')).toBe(Number);
    expect(Reflect.getMetadata('design:type', IngestionJobType.prototype, 'progress')).toBe(Number);
    expect(Reflect.getMetadata('design:type', IngestionJobType.prototype, 'errors')).toBe(Array);
  });

  it('exposes status enum', () => {
    expect(IngestionStatusEnum.PENDING).toBe('PENDING');
    expect(Object.values(IngestionStatusEnum)).toContain('FAILED');
  });
});

