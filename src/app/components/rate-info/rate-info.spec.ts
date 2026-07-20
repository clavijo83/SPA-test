import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RateInfo } from './rate-info';

describe('RateInfo', () => {
  let component: RateInfo;
  let fixture: ComponentFixture<RateInfo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RateInfo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RateInfo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
