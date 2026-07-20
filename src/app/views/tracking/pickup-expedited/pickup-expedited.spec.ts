import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PickupExpedited } from './pickup-expedited';

describe('PickupExpedited', () => {
  let component: PickupExpedited;
  let fixture: ComponentFixture<PickupExpedited>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PickupExpedited]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PickupExpedited);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
