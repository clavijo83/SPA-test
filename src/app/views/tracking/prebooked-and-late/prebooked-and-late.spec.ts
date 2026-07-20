import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrebookedAndLate } from './prebooked-and-late';

describe('PrebookedAndLate', () => {
  let component: PrebookedAndLate;
  let fixture: ComponentFixture<PrebookedAndLate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PrebookedAndLate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrebookedAndLate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
