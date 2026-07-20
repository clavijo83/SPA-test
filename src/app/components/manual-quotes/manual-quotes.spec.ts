import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManualQuotes } from './manual-quotes';

describe('ManualQuotes', () => {
  let component: ManualQuotes;
  let fixture: ComponentFixture<ManualQuotes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ManualQuotes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManualQuotes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
