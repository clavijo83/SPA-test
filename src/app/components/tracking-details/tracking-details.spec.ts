import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackingDetails } from './tracking-details';

describe('TrackingDetails', () => {
  let component: TrackingDetails;
  let fixture: ComponentFixture<TrackingDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TrackingDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrackingDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
