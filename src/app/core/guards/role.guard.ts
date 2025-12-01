import { CanActivateFn } from "@angular/router";
import { inject } from "@angular/core";
import { ClaimService } from "../services/claim.service";
import { isUserRoleEqualOrHigher } from "@shared/utils/user-role.utils";
import { UserRoleEnum } from "@shared/enums/user-roles.enum";
import { toObservable } from "@angular/core/rxjs-interop";
import { filter, map, take } from "rxjs";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const roleGuard: CanActivateFn = (route, state) => {
  const requiredRole = route.data["role"] as UserRoleEnum;
  const claimService = inject(ClaimService);
  // Prevent to quit page with needed role on reloading page even if the user have the right role

  return toObservable(claimService.role).pipe(
    filter((role): role is UserRoleEnum => role !== null && role !== undefined),
    take(1),
    map((role) => isUserRoleEqualOrHigher(requiredRole, role)),
  );
};
