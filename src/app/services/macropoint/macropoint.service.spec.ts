import { TestBed } from '@angular/core/testing';

import { MacropointService } from './macropoint.service';

describe('MacropointService', () => {
  let service: MacropointService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MacropointService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
