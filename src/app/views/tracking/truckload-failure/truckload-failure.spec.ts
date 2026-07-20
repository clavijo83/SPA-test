import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TruckloadFailure } from './truckload-failure';

describe('TruckloadFailure', () => {
  let component: TruckloadFailure;
  let fixture: ComponentFixture<TruckloadFailure>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TruckloadFailure]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TruckloadFailure);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
