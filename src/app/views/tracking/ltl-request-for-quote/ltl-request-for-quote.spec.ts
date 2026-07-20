import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LtlRequestForQuote } from './ltl-request-for-quote';

describe('LtlRequestForQuote', () => {
  let component: LtlRequestForQuote;
  let fixture: ComponentFixture<LtlRequestForQuote>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LtlRequestForQuote]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LtlRequestForQuote);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
