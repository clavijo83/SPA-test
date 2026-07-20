import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Expedited } from './expedited';

describe('Expedited', () => {
  let component: Expedited;
  let fixture: ComponentFixture<Expedited>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Expedited]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Expedited);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
