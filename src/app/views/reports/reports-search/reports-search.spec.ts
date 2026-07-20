import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportsSearch } from './reports-search';

describe('ReportsSearch', () => {
  let component: ReportsSearch;
  let fixture: ComponentFixture<ReportsSearch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReportsSearch]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportsSearch);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
