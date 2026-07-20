import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TypeAheadDropDown } from './type-ahead-drop-down';

describe('TypeAheadDropDown', () => {
  let component: TypeAheadDropDown;
  let fixture: ComponentFixture<TypeAheadDropDown>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TypeAheadDropDown]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TypeAheadDropDown);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
