import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppointmentRequired } from './appointment-required';

describe('AppointmentRequired', () => {
  let component: AppointmentRequired;
  let fixture: ComponentFixture<AppointmentRequired>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AppointmentRequired]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppointmentRequired);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
