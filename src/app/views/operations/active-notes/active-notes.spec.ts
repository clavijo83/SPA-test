import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActiveNotesComponent } from './active-notes';

describe('ActiveNotesComponent', () => {
  let component: ActiveNotesComponent;
  let fixture: ComponentFixture<ActiveNotesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ActiveNotesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActiveNotesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
