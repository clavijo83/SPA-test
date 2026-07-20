import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliveredDeliveryToday } from './delivered-delivery-today';

describe('DeliveredDeliveryToday', () => {
  let component: DeliveredDeliveryToday;
  let fixture: ComponentFixture<DeliveredDeliveryToday>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DeliveredDeliveryToday]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeliveredDeliveryToday);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
