import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuickRate } from './quick-rate';

describe('QuickRate', () => {
  let component: QuickRate;
  let fixture: ComponentFixture<QuickRate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [QuickRate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuickRate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
