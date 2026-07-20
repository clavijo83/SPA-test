import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliveryDateException } from './delivery-date-exception';

describe('DeliveryDateException', () => {
  let component: DeliveryDateException;
  let fixture: ComponentFixture<DeliveryDateException>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DeliveryDateException]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeliveryDateException);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
