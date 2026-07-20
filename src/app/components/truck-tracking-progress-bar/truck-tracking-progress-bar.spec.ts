import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TruckTrackingProgressBar } from './truck-tracking-progress-bar';

describe('TruckTrackingProgressBar', () => {
  let component: TruckTrackingProgressBar;
  let fixture: ComponentFixture<TruckTrackingProgressBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TruckTrackingProgressBar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TruckTrackingProgressBar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
