import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportsImcomplete } from './reports-imcomplete';

describe('ReportsImcomplete', () => {
  let component: ReportsImcomplete;
  let fixture: ComponentFixture<ReportsImcomplete>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReportsImcomplete]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportsImcomplete);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
