import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OfferQuotesModal } from './offer-quotes-modal';

describe('OfferQuotesModal', () => {
  let component: OfferQuotesModal;
  let fixture: ComponentFixture<OfferQuotesModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OfferQuotesModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OfferQuotesModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
