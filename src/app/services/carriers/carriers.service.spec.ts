import { TestBed } from '@angular/core/testing';

import { CarriersService } from './carriers.service';

describe('CarriersService', () => {
  let service: CarriersService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CarriersService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
