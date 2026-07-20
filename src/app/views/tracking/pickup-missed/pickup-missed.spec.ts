import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PickupMissed } from './pickup-missed';

describe('PickupMissed', () => {
  let component: PickupMissed;
  let fixture: ComponentFixture<PickupMissed>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PickupMissed]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PickupMissed);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
