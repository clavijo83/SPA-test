import {CanActivateFn} from '@angular/router';
import {inject} from '@angular/core';
import {GroupsService} from '../../services/groups/groups.service';

export const authgroupGuard: CanActivateFn = (route, state) => {
  const groupsService = inject(GroupsService);
  return groupsService.isValidPermission();
};
