import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShipmentInfoCards } from './shipment-info-cards';

describe('ShipmentInfoCards', () => {
  let component: ShipmentInfoCards;
  let fixture: ComponentFixture<ShipmentInfoCards>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ShipmentInfoCards]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShipmentInfoCards);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
