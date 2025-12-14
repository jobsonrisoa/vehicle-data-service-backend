import { VehicleMakeMapper } from '@application/mappers/vehicle-make.mapper';
import { VehicleType } from '@domain/entities/vehicle-type.entity';
import { VehicleMake } from '@domain/entities/vehicle-make.entity';

describe('VehicleMakeMapper', () => {
  it('should convert VehicleMake to DTO', () => {
    const vehicleType = VehicleType.create({ typeId: 1, typeName: 'Passenger Car' });
    const vehicleMake = VehicleMake.create({ makeId: 440, makeName: 'Audi' });
    vehicleMake.addVehicleType(vehicleType);

    const dto = VehicleMakeMapper.toDTO(vehicleMake);

    expect(dto.id).toBe(vehicleMake.id.toString());
    expect(dto.makeId).toBe(440);
    expect(dto.makeName).toBe('Audi');
    expect(dto.vehicleTypes).toHaveLength(1);
    expect(dto.vehicleTypes[0].typeId).toBe(1);
  });

  it('should convert VehicleMake to summary DTO', () => {
    const vehicleMake = VehicleMake.create({ makeId: 440, makeName: 'Audi' });

    const summary = VehicleMakeMapper.toSummaryDTO(vehicleMake);

    expect(summary.id).toBe(vehicleMake.id.toString());
    expect(summary.vehicleTypeCount).toBe(0);
  });

  it('should map lists to DTO lists', () => {
    const make1 = VehicleMake.create({ makeId: 440, makeName: 'Audi' });
    const make2 = VehicleMake.create({ makeId: 441, makeName: 'BMW' });

    const dtos = VehicleMakeMapper.toDTOList([make1, make2]);

    expect(dtos).toHaveLength(2);
    expect(dtos[1].makeName).toBe('BMW');
  });
});
