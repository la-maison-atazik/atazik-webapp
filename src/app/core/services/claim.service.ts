import { inject, Injectable, signal } from "@angular/core";
import { Auth } from "@angular/fire/auth";
import { UserRoleEnum } from "@shared/enums/user-roles.enum";
import { UserStatusEnum } from "@shared/enums/user-status.enum";
import { Functions, httpsCallable } from "@angular/fire/functions";
import { CloudFunctionsEnum } from "../enums/firebase/cloud-functions.enums";

@Injectable({
  providedIn: "root",
})
export class ClaimService {
  private functions = inject(Functions);
  private auth = inject(Auth);

  private _role = signal<UserRoleEnum | undefined>(undefined);
  role = this._role.asReadonly();

  private _status = signal<UserStatusEnum | undefined>(undefined);
  status = this._status.asReadonly();

  constructor() {
    this.auth.onAuthStateChanged(async (auth) => {
      if (!auth) {
        this._role.set(undefined);
        this._status.set(undefined);
        return;
      }

      try {
        const idTokenResult = await auth.getIdTokenResult(true);
        const role = idTokenResult.claims["role"] as UserRoleEnum | undefined;
        const status = idTokenResult.claims["status"] as UserStatusEnum | undefined;
        this._role.set(role);
        this._status.set(status);
      } catch (e) {
        console.error("Error fetching user claim:", e);
        this._role.set(undefined);
        this._status.set(undefined);
      }
    });
  }

  public async editUserRole(uid: string, role: UserRoleEnum): Promise<void> {
    try {
      const callable = httpsCallable(this.functions, CloudFunctionsEnum.EDIT_USER_ROLE);
      await callable({ uid, role });
    } catch (error) {
      console.error("Error editing user role:", error);
      throw new Error("Failed to edit user role. Please try again later.");
    }
  }
}
