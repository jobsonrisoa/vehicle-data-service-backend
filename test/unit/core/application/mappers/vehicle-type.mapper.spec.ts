import { VehicleTypeMapper } from '@application/mappers/vehicle-type.mapper';
import { VehicleType } from '@domain/entities/vehicle-type.entity';

describe('VehicleTypeMapper', () => {
  it('should map VehicleType to DTO', () => {
    const type = VehicleType.create({ typeId: 2, typeName: 'Passenger Car' });

    const dto = VehicleTypeMapper.toDTO(type);

    expect(dto.id).toBe(type.id.toString());
    expect(dto.typeId).toBe(2);
    expect(dto.typeName).toBe('Passenger Car');
  });

  it('should map list of VehicleType to DTOs', () => {
    const type1 = VehicleType.create({ typeId: 2, typeName: 'Passenger Car' });
    const type2 = VehicleType.create({ typeId: 3, typeName: 'Truck' });

    const dtos = VehicleTypeMapper.toDTOList([type1, type2]);

    expect(dtos).toHaveLength(2);
    expect(dtos[1].typeName).toBe('Truck');
  });
});
