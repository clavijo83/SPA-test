import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TruckloadProblem } from './truckload-problem';

describe('TruckloadProblem', () => {
  let component: TruckloadProblem;
  let fixture: ComponentFixture<TruckloadProblem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TruckloadProblem]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TruckloadProblem);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
