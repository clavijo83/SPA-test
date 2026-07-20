import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FreightTotals } from './freight-totals';

describe('FreightTotals', () => {
  let component: FreightTotals;
  let fixture: ComponentFixture<FreightTotals>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FreightTotals]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FreightTotals);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
