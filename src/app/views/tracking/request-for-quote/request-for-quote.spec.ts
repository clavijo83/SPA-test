import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestForQuote } from './request-for-quote';

describe('RequestForQuote', () => {
  let component: RequestForQuote;
  let fixture: ComponentFixture<RequestForQuote>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RequestForQuote]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RequestForQuote);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
