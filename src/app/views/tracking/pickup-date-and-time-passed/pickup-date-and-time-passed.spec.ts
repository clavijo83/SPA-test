import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PickupDateAndTimePassed } from './pickup-date-and-time-passed';

describe('PickupDateAndTimePassed', () => {
  let component: PickupDateAndTimePassed;
  let fixture: ComponentFixture<PickupDateAndTimePassed>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PickupDateAndTimePassed]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PickupDateAndTimePassed);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
