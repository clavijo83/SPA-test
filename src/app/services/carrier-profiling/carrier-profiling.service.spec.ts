import { TestBed } from '@angular/core/testing';

import { CarrierProfilingService } from './carrier-profiling.service';

describe('CarrierProfilingService', () => {
  let service: CarrierProfilingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CarrierProfilingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
