import { TestBed } from '@angular/core/testing';

import { FastForexService } from './fast-forex.service';

describe('FastForexService', () => {
  let service: FastForexService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FastForexService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
