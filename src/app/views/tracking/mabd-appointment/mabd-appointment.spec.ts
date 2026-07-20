import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MabdAppointment } from './mabd-appointment';

describe('MabdAppointment', () => {
  let component: MabdAppointment;
  let fixture: ComponentFixture<MabdAppointment>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MabdAppointment]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MabdAppointment);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
