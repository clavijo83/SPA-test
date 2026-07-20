import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TruckloadAtDelivery } from './truckload-at-delivery';

describe('TruckloadAtDelivery', () => {
  let component: TruckloadAtDelivery;
  let fixture: ComponentFixture<TruckloadAtDelivery>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TruckloadAtDelivery]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TruckloadAtDelivery);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
