import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShipmentAccessDenied } from './shipment-access-denied';

describe('ShipmentAccessDenied', () => {
  let component: ShipmentAccessDenied;
  let fixture: ComponentFixture<ShipmentAccessDenied>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ShipmentAccessDenied]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShipmentAccessDenied);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
