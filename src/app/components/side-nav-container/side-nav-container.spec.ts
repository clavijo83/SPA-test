import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SideNavContainer } from './side-nav-container';

describe('SideNavContainer', () => {
  let component: SideNavContainer;
  let fixture: ComponentFixture<SideNavContainer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SideNavContainer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SideNavContainer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
