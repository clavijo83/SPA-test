import { TestBed } from '@angular/core/testing';

import {LoadBoardService } from './loadboard.service';

describe('LoadBoardService', () => {
  let service: LoadBoardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoadBoardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
