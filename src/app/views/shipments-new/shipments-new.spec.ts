import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShipmentsNew } from './shipments-new';

describe('ShipmentsNew', () => {
  let component: ShipmentsNew;
  let fixture: ComponentFixture<ShipmentsNew>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ShipmentsNew]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShipmentsNew);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
