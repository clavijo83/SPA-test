import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TruckloadTracking } from './truckload-tracking';

describe('TruckloadTracking', () => {
  let component: TruckloadTracking;
  let fixture: ComponentFixture<TruckloadTracking>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TruckloadTracking]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TruckloadTracking);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
