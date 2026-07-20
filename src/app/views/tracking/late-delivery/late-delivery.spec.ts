import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LateDelivery } from './late-delivery';

describe('LateDelivery', () => {
  let component: LateDelivery;
  let fixture: ComponentFixture<LateDelivery>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LateDelivery]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LateDelivery);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
