import { CanActivateFn } from "@angular/router";
import { GroupsService } from "../../services/groups/groups.service";
import { inject } from "@angular/core";

export const shipmentGuard: CanActivateFn = (route, state) => {
  const groupsService = inject(GroupsService);
  return <any>groupsService.isValidPermission();
};
