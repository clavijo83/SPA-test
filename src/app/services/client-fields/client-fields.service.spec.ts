import { TestBed } from '@angular/core/testing';

import { ClientFieldsService } from './client-fields.service';

describe('ClientFieldsService', () => {
  let service: ClientFieldsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClientFieldsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
