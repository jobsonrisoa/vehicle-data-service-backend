import { DomainEvent } from './domain-event';

interface VehicleMakeCreatedPayload {
  makeId: number;
  makeName: string;
  vehicleTypeCount: number;
}

export class VehicleMakeCreatedEvent extends DomainEvent<VehicleMakeCreatedPayload> {
  constructor(makeId: string, payload: VehicleMakeCreatedPayload) {
    super(makeId, 'vehicle.make.created', payload);
  }
}
