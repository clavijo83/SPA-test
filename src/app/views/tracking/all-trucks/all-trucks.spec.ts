import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllTrucks } from './all-trucks';

describe('AllTrucks', () => {
  let component: AllTrucks;
  let fixture: ComponentFixture<AllTrucks>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AllTrucks]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllTrucks);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
