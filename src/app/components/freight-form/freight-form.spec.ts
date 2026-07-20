import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FreightForm } from './freight-form';

describe('FreightForm', () => {
  let component: FreightForm;
  let fixture: ComponentFixture<FreightForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FreightForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FreightForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
