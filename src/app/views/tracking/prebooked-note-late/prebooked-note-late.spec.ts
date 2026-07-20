import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrebookedNoteLate } from './prebooked-note-late';

describe('PrebookedNoteLate', () => {
  let component: PrebookedNoteLate;
  let fixture: ComponentFixture<PrebookedNoteLate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PrebookedNoteLate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrebookedNoteLate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
