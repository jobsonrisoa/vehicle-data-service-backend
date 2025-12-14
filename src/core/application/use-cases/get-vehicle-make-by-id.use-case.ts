import { Injectable } from '@nestjs/common';

import { VehicleMakeDTO } from '@application/dtos/vehicle-make.dto';
import { VehicleMakeMapper } from '@application/mappers/vehicle-make.mapper';
import { IVehicleMakeRepository } from '@application/ports/output/vehicle-repository.port';
import { NotFoundError } from '@domain/errors/not-found-error';
import { ValidationError } from '@domain/errors/validation-error';

@Injectable()
export class GetVehicleMakeByIdUseCase {
  constructor(private readonly vehicleMakeRepository: IVehicleMakeRepository) {}

  async execute(makeId: number): Promise<VehicleMakeDTO> {
    this.validateMakeId(makeId);

    const vehicleMake = await this.vehicleMakeRepository.findByMakeId(makeId);

    if (!vehicleMake) {
      throw new NotFoundError(`Vehicle make with ID ${makeId} not found`);
    }

    return VehicleMakeMapper.toDTO(vehicleMake);
  }

  private validateMakeId(makeId: unknown): void {
    if (makeId === null || makeId === undefined) {
      throw new ValidationError('makeId is required');
    }

    if (typeof makeId !== 'number') {
      throw new ValidationError('makeId must be a number');
    }

    if (!Number.isInteger(makeId) || makeId <= 0) {
      throw new ValidationError('makeId must be a positive integer');
    }
  }
}

