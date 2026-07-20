import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LateQuoteResponses } from './late-quote-responses';

describe('LateQuoteResponses', () => {
  let component: LateQuoteResponses;
  let fixture: ComponentFixture<LateQuoteResponses>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LateQuoteResponses]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LateQuoteResponses);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
