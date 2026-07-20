import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarrierManagement } from './carrier-management';

describe('CarrierManagement', () => {
  let component: CarrierManagement;
  let fixture: ComponentFixture<CarrierManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CarrierManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CarrierManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
