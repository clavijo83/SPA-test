import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchReport } from './search-report';

describe('SearchReport', () => {
  let component: SearchReport;
  let fixture: ComponentFixture<SearchReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SearchReport]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchReport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
