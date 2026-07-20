import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Problem } from './problem';

describe('Problem', () => {
  let component: Problem;
  let fixture: ComponentFixture<Problem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Problem]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Problem);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
