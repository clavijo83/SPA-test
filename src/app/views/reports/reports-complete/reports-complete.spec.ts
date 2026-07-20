import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportsComplete } from './reports-complete';

describe('ReportsComplete', () => {
  let component: ReportsComplete;
  let fixture: ComponentFixture<ReportsComplete>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReportsComplete]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportsComplete);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
