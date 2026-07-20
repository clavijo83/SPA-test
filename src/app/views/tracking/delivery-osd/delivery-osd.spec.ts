import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliveryOsd } from './delivery-osd';

describe('DeliveryOsd', () => {
  let component: DeliveryOsd;
  let fixture: ComponentFixture<DeliveryOsd>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DeliveryOsd]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeliveryOsd);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
