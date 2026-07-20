import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RatesGrid } from './rates-grid';

describe('RatesGrid', () => {
  let component: RatesGrid;
  let fixture: ComponentFixture<RatesGrid>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RatesGrid]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RatesGrid);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
