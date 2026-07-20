import { TestBed } from '@angular/core/testing';

import { ShipmentSaveService } from './shipment-save.service';

describe('ShipmentSaveService', () => {
  let service: ShipmentSaveService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ShipmentSaveService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
