import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ActiveNotesView} from './active-notes-view';

describe('ActiveNotesView', () => {
  let component: ActiveNotesView;
  let fixture: ComponentFixture<ActiveNotesView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ActiveNotesView]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ActiveNotesView);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
