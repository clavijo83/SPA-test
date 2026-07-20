import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportGrid } from './report-grid';

describe('ReportGrid', () => {
  let component: ReportGrid;
  let fixture: ComponentFixture<ReportGrid>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReportGrid]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportGrid);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
