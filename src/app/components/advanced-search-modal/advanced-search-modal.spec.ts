import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdvancedSearchModal } from './advanced-search-modal';

describe('AdvancedSearchModal', () => {
  let component: AdvancedSearchModal;
  let fixture: ComponentFixture<AdvancedSearchModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdvancedSearchModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdvancedSearchModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
