import { TestBed } from '@angular/core/testing';

import { DensityService } from './density.service';

describe('DensityService', () => {
  let service: DensityService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DensityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
