import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TruckloadAtPickup } from './truckload-at-pickup';

describe('TruckloadAtPickup', () => {
  let component: TruckloadAtPickup;
  let fixture: ComponentFixture<TruckloadAtPickup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TruckloadAtPickup]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TruckloadAtPickup);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
