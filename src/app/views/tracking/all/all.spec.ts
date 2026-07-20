import { ComponentFixture, TestBed } from '@angular/core/testing';

import { All } from './all';

describe('All', () => {
  let component: All;
  let fixture: ComponentFixture<All>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [All]
    })
    .compileComponents();

    fixture = TestBed.createComponent(All);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
