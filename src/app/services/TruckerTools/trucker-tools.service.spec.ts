import { TestBed } from '@angular/core/testing';

import { TruckerToolsService } from './trucker-tools.service';

describe('TruckerToolsService', () => {
  let service: TruckerToolsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TruckerToolsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
