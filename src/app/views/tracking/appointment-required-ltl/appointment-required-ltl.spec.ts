import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppointmentRequiredLtl } from './appointment-required-ltl';

describe('AppointmentRequiredLtl', () => {
  let component: AppointmentRequiredLtl;
  let fixture: ComponentFixture<AppointmentRequiredLtl>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AppointmentRequiredLtl]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppointmentRequiredLtl);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
