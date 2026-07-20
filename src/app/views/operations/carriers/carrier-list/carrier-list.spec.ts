import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarrierListComponent } from './carrier-list';

describe('CarrierListComponent', () => {
  let component: CarrierListComponent;
  let fixture: ComponentFixture<CarrierListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CarrierListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CarrierListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
