import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Cancelled } from './cancelled';

describe('Cancelled', () => {
  let component: Cancelled;
  let fixture: ComponentFixture<Cancelled>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Cancelled]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Cancelled);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
