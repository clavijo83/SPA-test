import {ComponentFixture, TestBed} from '@angular/core/testing';

import {TruckInfoCards} from './truck-info-cards';

describe('TruckInfoCards', () => {
  let component: TruckInfoCards;
  let fixture: ComponentFixture<TruckInfoCards>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TruckInfoCards]
    })
      .compileComponents();

    fixture = TestBed.createComponent(TruckInfoCards);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
