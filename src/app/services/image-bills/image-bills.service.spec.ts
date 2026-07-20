import { TestBed } from '@angular/core/testing';

import { ImageBillsService } from './image-bills.service';

describe('ImageBillsService', () => {
  let service: ImageBillsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImageBillsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
