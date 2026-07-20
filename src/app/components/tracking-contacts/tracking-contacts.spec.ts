import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackingContactsComponent } from './tracking-contacts';

describe('TrackingContactsComponent', () => {
  let component: TrackingContactsComponent;
  let fixture: ComponentFixture<TrackingContactsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TrackingContactsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrackingContactsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
