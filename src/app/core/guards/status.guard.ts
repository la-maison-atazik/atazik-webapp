import { CanActivateFn } from "@angular/router";
import { inject } from "@angular/core";
import { ClaimService } from "../services/claim.service";
import { toObservable } from "@angular/core/rxjs-interop";
import { filter, map, take } from "rxjs";
import { UserStatusEnum } from "@shared/enums/user-status.enum";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const statusGuard: CanActivateFn = (route, state) => {
  const requiredStatus = route.data["status"] as UserStatusEnum;
  const claimService = inject(ClaimService);
  // Prevent to quit page with needed role on reloading page even if the user have the right role

  return toObservable(claimService.status).pipe(
    filter((status): status is UserStatusEnum => status !== null && status !== undefined),
    take(1),
    map((status) => requiredStatus === status),
  );
};
