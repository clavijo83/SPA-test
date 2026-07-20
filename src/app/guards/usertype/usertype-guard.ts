import { CanActivateFn } from "@angular/router";
import { GroupsService } from "../../services/groups/groups.service";
import { inject } from "@angular/core";

export const usertypeGuard: CanActivateFn = (route, state) => {
  const groupsService = inject(GroupsService);
  return groupsService.isValidUserType();
};
