import { TestBed } from '@angular/core/testing';

import { ActiveNotesService } from './active-notes.service';

describe('ActiveNotesService', () => {
  let service: ActiveNotesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ActiveNotesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
