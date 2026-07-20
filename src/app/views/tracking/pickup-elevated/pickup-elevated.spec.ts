import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PickupElevated } from './pickup-elevated';

describe('PickupElevated', () => {
  let component: PickupElevated;
  let fixture: ComponentFixture<PickupElevated>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PickupElevated]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PickupElevated);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
