import { TestBed } from '@angular/core/testing';

import { CargoClaimService } from './cargo-claim.service';

describe('CargoClaimService', () => {
  let service: CargoClaimService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CargoClaimService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
