import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookedNotLate } from './booked-not-late';

describe('BookedNotLate', () => {
  let component: BookedNotLate;
  let fixture: ComponentFixture<BookedNotLate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BookedNotLate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BookedNotLate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
