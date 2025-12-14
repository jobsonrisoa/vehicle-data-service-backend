import { Injectable } from '@nestjs/common';

import { PaginatedResult, PaginationOptions, Edge } from '@application/dtos/pagination.dto';
import { VehicleMakeDTO } from '@application/dtos/vehicle-make.dto';
import { VehicleMakeMapper } from '@application/mappers/vehicle-make.mapper';
import { IVehicleMakeRepository } from '@application/ports/output/vehicle-repository.port';
import { ValidationError } from '@domain/errors/validation-error';

@Injectable()
export class GetAllVehicleMakesUseCase {
  private static readonly MAX_PAGE_SIZE = 100;

  constructor(private readonly vehicleMakeRepository: IVehicleMakeRepository) {}

  async execute(options: PaginationOptions = {}): Promise<PaginatedResult<VehicleMakeDTO>> {
    this.validatePaginationOptions(options);

    const paginatedEntities = await this.vehicleMakeRepository.findAll(options);

    const dtoEdges: Edge<VehicleMakeDTO>[] = paginatedEntities.edges.map((edge) => ({
      node: VehicleMakeMapper.toDTO(edge.node),
      cursor: edge.cursor,
    }));

    return {
      edges: dtoEdges,
      pageInfo: paginatedEntities.pageInfo,
      totalCount: paginatedEntities.totalCount,
    };
  }

  private validatePaginationOptions(options: PaginationOptions): void {
    if (options.first !== undefined) {
      if (typeof options.first !== 'number' || !Number.isInteger(options.first)) {
        throw new ValidationError('first must be an integer');
      }

      if (options.first <= 0) {
        throw new ValidationError('first must be a positive integer');
      }

      if (options.first > GetAllVehicleMakesUseCase.MAX_PAGE_SIZE) {
        throw new ValidationError(`first cannot exceed ${GetAllVehicleMakesUseCase.MAX_PAGE_SIZE}`);
      }
    }

    if (options.after !== undefined) {
      if (typeof options.after !== 'string') {
        throw new ValidationError('after must be a string');
      }

      if (options.after.trim() === '') {
        throw new ValidationError('after cannot be an empty string');
      }
    }
  }
}

