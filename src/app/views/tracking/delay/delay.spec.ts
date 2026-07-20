import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Delay } from './delay';

describe('Delay', () => {
  let component: Delay;
  let fixture: ComponentFixture<Delay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Delay]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Delay);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
