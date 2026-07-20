import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TruckloadInTransit } from './truckload-in-transit';

describe('TruckloadInTransit', () => {
  let component: TruckloadInTransit;
  let fixture: ComponentFixture<TruckloadInTransit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TruckloadInTransit]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TruckloadInTransit);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
