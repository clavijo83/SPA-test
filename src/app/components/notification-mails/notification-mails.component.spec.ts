import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationMailsComponent } from './notification-mails.component';

describe('NotificationMails', () => {
  let component: NotificationMailsComponent;
  let fixture: ComponentFixture<NotificationMailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NotificationMailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotificationMailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
