import { VehicleMakeCreatedEvent } from '@domain/events/vehicle-make-created.event';

describe('VehicleMakeCreatedEvent (Unit)', () => {
  it('should have eventType "vehicle.make.created"', () => {
    const event = new VehicleMakeCreatedEvent('make-123', {
      makeId: 440,
      makeName: 'ASTON MARTIN',
      vehicleTypeCount: 3,
    });

    expect(event.eventType).toBe('vehicle.make.created');
  });

  it('should contain makeId in payload', () => {
    const event = new VehicleMakeCreatedEvent('make-123', {
      makeId: 440,
      makeName: 'ASTON MARTIN',
      vehicleTypeCount: 3,
    });

    expect(event.payload.makeId).toBe(440);
  });

  it('should contain makeName in payload', () => {
    const event = new VehicleMakeCreatedEvent('make-123', {
      makeId: 440,
      makeName: 'TESLA',
      vehicleTypeCount: 2,
    });

    expect(event.payload.makeName).toBe('TESLA');
  });

  it('should contain vehicleTypeCount in payload', () => {
    const event = new VehicleMakeCreatedEvent('make-123', {
      makeId: 440,
      makeName: 'ASTON MARTIN',
      vehicleTypeCount: 5,
    });

    expect(event.payload.vehicleTypeCount).toBe(5);
  });
});
