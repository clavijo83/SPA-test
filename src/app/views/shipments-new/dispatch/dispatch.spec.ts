import {ComponentFixture, TestBed} from '@angular/core/testing';

import {Dispatch} from './dispatch';

describe('Dispatch', () => {
  let component: Dispatch;
  let fixture: ComponentFixture<Dispatch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Dispatch]
    })
      .compileComponents();

    fixture = TestBed.createComponent(Dispatch);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
