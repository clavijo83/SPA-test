import { TestBed } from '@angular/core/testing';

import { InternalGroupService } from './internal-group.service';

describe('InternalGroupService', () => {
  let service: InternalGroupService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InternalGroupService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
