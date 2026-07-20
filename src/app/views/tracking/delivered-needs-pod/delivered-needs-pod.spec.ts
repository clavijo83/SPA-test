import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliveredNeedsPod } from './delivered-needs-pod';

describe('DeliveredNeedsPod', () => {
  let component: DeliveredNeedsPod;
  let fixture: ComponentFixture<DeliveredNeedsPod>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DeliveredNeedsPod]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeliveredNeedsPod);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
