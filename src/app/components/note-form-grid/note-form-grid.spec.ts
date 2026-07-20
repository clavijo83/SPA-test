import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoteFormGrid } from './note-form-grid';

describe('NoteFormGrid', () => {
  let component: NoteFormGrid;
  let fixture: ComponentFixture<NoteFormGrid>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NoteFormGrid]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NoteFormGrid);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
