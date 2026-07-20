import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Guaranteed } from './guaranteed';

describe('Guaranteed', () => {
  let component: Guaranteed;
  let fixture: ComponentFixture<Guaranteed>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Guaranteed]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Guaranteed);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
