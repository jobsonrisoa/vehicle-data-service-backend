import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { IIngestionJobRepository } from '@application/ports/output/ingestion-job-repository.port';
import { IngestionJob } from '@domain/entities/ingestion-job.entity';
import { IngestionStatus } from '@domain/enums/ingestion-status.enum';
import { JobId } from '@domain/value-objects/job-id.vo';

import { IngestionJobOrmEntity } from '../entities/ingestion-job.orm-entity';
import { IngestionJobMapper } from '../mappers/ingestion-job.mapper';

@Injectable()
export class IngestionJobRepository implements IIngestionJobRepository {
  private readonly ormRepository: Repository<IngestionJobOrmEntity>;

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {
    this.ormRepository = dataSource.getRepository(IngestionJobOrmEntity);
  }

  async save(job: IngestionJob): Promise<void> {
    const ormEntity = IngestionJobMapper.toORM(job);
    await this.ormRepository.save(ormEntity);
  }

  async findById(id: JobId): Promise<IngestionJob | null> {
    const ormEntity = await this.ormRepository.findOne({ where: { id: id.value } });
    return ormEntity ? IngestionJobMapper.toDomain(ormEntity) : null;
  }

  async findLatest(): Promise<IngestionJob | null> {
    const ormEntity = await this.ormRepository.findOne({ where: {}, order: { startedAt: 'DESC' } });
    return ormEntity ? IngestionJobMapper.toDomain(ormEntity) : null;
  }

  async findByStatus(status: IngestionStatus): Promise<IngestionJob[]> {
    const ormEntities = await this.ormRepository.find({
      where: { status },
      order: { startedAt: 'DESC' },
    });
    return ormEntities.map((entity) => IngestionJobMapper.toDomain(entity));
  }

  async findAll(): Promise<IngestionJob[]> {
    const ormEntities = await this.ormRepository.find({ order: { startedAt: 'DESC' } });
    return ormEntities.map((entity) => IngestionJobMapper.toDomain(entity));
  }

  async updateStatus(id: JobId, status: IngestionStatus): Promise<void> {
    const ormEntity = await this.ormRepository.findOne({ where: { id: id.value } });
    if (!ormEntity) {
      throw new Error('IngestionJob not found');
    }
    ormEntity.status = status;
    await this.ormRepository.save(ormEntity);
  }

  async hasRunningJob(): Promise<boolean> {
    const count = await this.ormRepository.count({ where: { status: IngestionStatus.IN_PROGRESS } });
    return count > 0;
  }

  async delete(id: JobId): Promise<void> {
    await this.ormRepository.delete({ id: id.value });
  }

  async count(): Promise<number> {
    return this.ormRepository.count();
  }
}

