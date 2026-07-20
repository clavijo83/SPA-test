import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackingProgressBar } from './tracking-progress-bar';

describe('TrackingProgressBar', () => {
  let component: TrackingProgressBar;
  let fixture: ComponentFixture<TrackingProgressBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TrackingProgressBar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrackingProgressBar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
