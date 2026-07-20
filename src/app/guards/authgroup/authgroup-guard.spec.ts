import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { authgroupGuard } from './authgroup-guard';

describe('authgroupGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => authgroupGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
