import { TestBed } from '@angular/core/testing';

import { AvailableCarriersService } from './available-carriers.service';

describe('AvailableCarriersService', () => {
  let service: AvailableCarriersService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AvailableCarriersService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
