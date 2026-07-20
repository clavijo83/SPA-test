import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccessorialsComponent} from './accessorials';

describe('AccessorialsComponent', () => {
  let component: AccessorialsComponent;
  let fixture: ComponentFixture<AccessorialsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AccessorialsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccessorialsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
