import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubmittedQuotes } from './submitted-quotes';

describe('SubmittedQuotes', () => {
  let component: SubmittedQuotes;
  let fixture: ComponentFixture<SubmittedQuotes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SubmittedQuotes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubmittedQuotes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
