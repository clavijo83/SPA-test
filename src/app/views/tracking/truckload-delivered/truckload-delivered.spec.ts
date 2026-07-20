import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TruckloadDelivered } from './truckload-delivered';

describe('TruckloadDelivered', () => {
  let component: TruckloadDelivered;
  let fixture: ComponentFixture<TruckloadDelivered>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TruckloadDelivered]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TruckloadDelivered);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
