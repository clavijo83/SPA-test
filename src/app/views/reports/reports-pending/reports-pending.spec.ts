import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportsPending } from './reports-pending';

describe('ReportsPending', () => {
  let component: ReportsPending;
  let fixture: ComponentFixture<ReportsPending>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReportsPending]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportsPending);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
