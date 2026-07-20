import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnableToDeliver } from './unable-to-deliver';

describe('UnableToDeliver', () => {
  let component: UnableToDeliver;
  let fixture: ComponentFixture<UnableToDeliver>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UnableToDeliver]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnableToDeliver);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
