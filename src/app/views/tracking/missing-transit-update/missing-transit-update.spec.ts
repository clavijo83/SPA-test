import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MissingTransitUpdate } from './missing-transit-update';

describe('MissingTransitUpdate', () => {
  let component: MissingTransitUpdate;
  let fixture: ComponentFixture<MissingTransitUpdate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MissingTransitUpdate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MissingTransitUpdate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
