import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackingFilterGrid } from './tracking-filter-grid';

describe('TrackingFilterGrid', () => {
  let component: TrackingFilterGrid;
  let fixture: ComponentFixture<TrackingFilterGrid>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TrackingFilterGrid]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrackingFilterGrid);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
