import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoTrack } from './no-track';

describe('NoTrack', () => {
  let component: NoTrack;
  let fixture: ComponentFixture<NoTrack>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NoTrack]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NoTrack);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
