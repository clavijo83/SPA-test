import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TruckloadTrackingDetails } from './truckload-tracking-details';

describe('TruckloadTrackingDetails', () => {
  let component: TruckloadTrackingDetails;
  let fixture: ComponentFixture<TruckloadTrackingDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TruckloadTrackingDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TruckloadTrackingDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
