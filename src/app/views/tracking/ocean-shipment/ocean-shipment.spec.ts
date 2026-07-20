import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OceanShipment } from './ocean-shipment';

describe('OceanShipment', () => {
  let component: OceanShipment;
  let fixture: ComponentFixture<OceanShipment>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OceanShipment]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OceanShipment);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
