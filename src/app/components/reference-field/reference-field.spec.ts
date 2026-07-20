import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReferenceFieldComponent } from './reference-field';

describe('ReferenceFieldComponent', () => {
  let component: ReferenceFieldComponent;
  let fixture: ComponentFixture<ReferenceFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReferenceFieldComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReferenceFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
