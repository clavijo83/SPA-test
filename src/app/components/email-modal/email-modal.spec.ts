import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailModal } from './email-modal';

describe('EmailModal', () => {
  let component: EmailModal;
  let fixture: ComponentFixture<EmailModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EmailModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmailModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
