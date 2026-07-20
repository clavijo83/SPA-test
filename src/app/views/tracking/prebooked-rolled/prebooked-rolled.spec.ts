import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrebookedRolled } from './prebooked-rolled';

describe('PrebookedRolled', () => {
  let component: PrebookedRolled;
  let fixture: ComponentFixture<PrebookedRolled>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PrebookedRolled]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrebookedRolled);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
