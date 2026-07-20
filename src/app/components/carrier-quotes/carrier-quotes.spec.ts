import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarrierQuotes } from './carrier-quotes';

describe('CarrierQuotes', () => {
  let component: CarrierQuotes;
  let fixture: ComponentFixture<CarrierQuotes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CarrierQuotes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CarrierQuotes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
