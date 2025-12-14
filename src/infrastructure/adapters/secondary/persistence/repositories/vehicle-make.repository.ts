import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { PaginatedResult, PaginationOptions, Edge, PageInfo } from '@application/dtos/pagination.dto';
import { IVehicleMakeRepository, VehicleMakeFilter } from '@application/ports/output/vehicle-repository.port';
import { VehicleMake } from '@domain/entities/vehicle-make.entity';
import { MakeId } from '@domain/value-objects/make-id.vo';

import { VehicleMakeOrmEntity } from '../entities/vehicle-make.orm-entity';
import { VehicleMakeMapper } from '../mappers/vehicle-make.mapper';

@Injectable()
export class VehicleMakeRepository implements IVehicleMakeRepository {
  private readonly ormRepository: Repository<VehicleMakeOrmEntity>;

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {
    this.ormRepository = dataSource.getRepository(VehicleMakeOrmEntity);
  }

  async save(vehicleMake: VehicleMake): Promise<void> {
    const ormEntity = VehicleMakeMapper.toORM(vehicleMake);
    await this.ormRepository.save(ormEntity);
  }

  async saveMany(vehicleMakes: VehicleMake[]): Promise<void> {
    if (vehicleMakes.length === 0) {
      return;
    }

    const ormEntities = vehicleMakes.map((make) => VehicleMakeMapper.toORM(make));

    // Save in chunks to avoid overwhelming the database with very large batches.
    const chunkSize = 50;
    for (let i = 0; i < ormEntities.length; i += chunkSize) {
      const chunk = ormEntities.slice(i, i + chunkSize);
      await this.ormRepository.save(chunk);
    }
  }

  async findByMakeId(makeId: number): Promise<VehicleMake | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: { makeId },
      relations: ['vehicleTypes'],
    });

    if (!ormEntity) {
      return null;
    }

    return VehicleMakeMapper.toDomain(ormEntity);
  }

  async findById(id: MakeId): Promise<VehicleMake | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: { id: id.value },
      relations: ['vehicleTypes'],
    });

    if (!ormEntity) {
      return null;
    }

    return VehicleMakeMapper.toDomain(ormEntity);
  }

  async findAll(options: PaginationOptions): Promise<PaginatedResult<VehicleMake>> {
    const limit = options.first ?? 10;

    let query = this.ormRepository
      .createQueryBuilder('make')
      .leftJoinAndSelect('make.vehicleTypes', 'type')
      .orderBy('make.makeId', 'ASC')
      .take(limit + 1); // fetch one extra to detect next page

    if (options.after) {
      const afterId = this.decodeCursor(options.after);
      query = query.where('make.makeId > :afterId', { afterId });
    }

    const results = await query.getMany();

    const hasNextPage = results.length > limit;
    if (hasNextPage) {
      results.pop();
    }

    const edges: Edge<VehicleMake>[] = results.map((ormEntity) => ({
      node: VehicleMakeMapper.toDomain(ormEntity),
      cursor: this.encodeCursor(ormEntity.makeId),
    }));

    const pageInfo: PageInfo = {
      hasNextPage,
      hasPreviousPage: Boolean(options.after),
      startCursor: edges.length > 0 ? edges[0].cursor : null,
      endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
    };

    const totalCount = await this.ormRepository.count();

    return { edges, pageInfo, totalCount };
  }

  async findByFilter(filter: VehicleMakeFilter): Promise<VehicleMake[]> {
    let query = this.ormRepository
      .createQueryBuilder('make')
      .leftJoinAndSelect('make.vehicleTypes', 'type')
      .distinct(true);

    if (filter.makeNameContains) {
      query = query.where('LOWER(make.makeName) LIKE :name', {
        name: `%${filter.makeNameContains.toLowerCase()}%`,
      });
    }

    if (filter.hasVehicleType !== undefined) {
      query = query.andWhere('type.typeId = :typeId', { typeId: filter.hasVehicleType });
    }

    if (filter.createdAfter) {
      query = query.andWhere('make.createdAt > :createdAfter', { createdAfter: filter.createdAfter });
    }

    if (filter.createdBefore) {
      query = query.andWhere('make.createdAt < :createdBefore', {
        createdBefore: filter.createdBefore,
      });
    }

    const results = await query.getMany();
    return results.map((ormEntity) => VehicleMakeMapper.toDomain(ormEntity));
  }

  async count(): Promise<number> {
    return this.ormRepository.count();
  }

  async deleteAll(): Promise<void> {
    await this.ormRepository.createQueryBuilder().delete().from(VehicleMakeOrmEntity).execute();
  }

  private encodeCursor(value: number): string {
    return Buffer.from(value.toString()).toString('base64');
  }

  private decodeCursor(cursor: string): number {
    return parseInt(Buffer.from(cursor, 'base64').toString('utf-8'), 10);
  }
}

