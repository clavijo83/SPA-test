import { TestBed } from '@angular/core/testing';

import { TruckSaveService } from './truck-save.service';

describe('TruckSaveService', () => {
  let service: TruckSaveService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TruckSaveService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
