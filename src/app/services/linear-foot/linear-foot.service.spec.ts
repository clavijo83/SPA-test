import { TestBed } from '@angular/core/testing';

import { LinearFootService } from './linear-foot.service';

describe('LinearFootService', () => {
  let service: LinearFootService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LinearFootService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
