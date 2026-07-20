import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportsQuotes } from './reports-quotes';

describe('ReportsQuotes', () => {
  let component: ReportsQuotes;
  let fixture: ComponentFixture<ReportsQuotes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReportsQuotes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportsQuotes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
