import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TruckloadPending } from './truckload-pending';

describe('TruckloadPending', () => {
  let component: TruckloadPending;
  let fixture: ComponentFixture<TruckloadPending>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TruckloadPending]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TruckloadPending);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
