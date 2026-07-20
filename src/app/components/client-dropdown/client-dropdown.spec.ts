import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientDropdown } from './client-dropdown';

describe('ClientDropdown', () => {
  let component: ClientDropdown;
  let fixture: ComponentFixture<ClientDropdown>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClientDropdown]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientDropdown);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
