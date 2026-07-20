import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthenticatorService } from "@aws-amplify/ui-angular";
import { fetchAuthSession } from "aws-amplify/auth";

export const authGuard: CanActivateFn = (route, state) => {
  inject(AuthenticatorService);
  return fetchAuthSession()
    .then(() => {
      return true;
    })
    .catch(() => {
      const router = inject(Router);
      router.navigate([""]);
      return false;
    });
};
