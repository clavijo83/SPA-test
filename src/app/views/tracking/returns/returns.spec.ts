import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Returns } from './returns';

describe('Returns', () => {
  let component: Returns;
  let fixture: ComponentFixture<Returns>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Returns]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Returns);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
