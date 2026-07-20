import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TruckloadDispatched } from './truckload-dispatched';

describe('TruckloadDispatched', () => {
  let component: TruckloadDispatched;
  let fixture: ComponentFixture<TruckloadDispatched>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TruckloadDispatched]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TruckloadDispatched);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
