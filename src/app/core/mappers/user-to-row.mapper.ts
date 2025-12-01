import { PartialFirebaseUser } from "../models/firebase-user.model";
import { FirebaseUserRow } from "../models/tables-row/firebase-user-row.model";
import { getUserRoleLabel } from "@shared/utils/user-role.utils";
import { UserInvite } from "@shared/models/user-invite.model";
import { UserStatusEnum } from "@shared/enums/user-status.enum";
import { UserRoleEnum } from "@shared/enums/user-roles.enum";
import { getStatusLabel } from "@shared/utils/user-status.utils";

export function mapFirebaseUserToRow(user: PartialFirebaseUser): FirebaseUserRow {
  const { uid, email, displayName, emailVerified, customClaims } = user;
  const statusActivated = emailVerified && customClaims?.["status"] === UserStatusEnum.ACTIVATED;

  return {
    uid: uid,
    displayName: displayName || "Aucun nom défini",
    email: email || "Aucun e-mail défini",
    status: customClaims?.["status"],
    role: customClaims?.["role"],
    statusChip: {
      label: getStatusLabel(customClaims?.["status"], emailVerified),
      icon: statusActivated ? "pi pi-check" : "pi pi-times",
      class: statusActivated
        ? "bg-green text-white"
        : !emailVerified
          ? "bg-yellow text-white"
          : "bg-gray text-white",
    },
    roleChip: {
      label: getUserRoleLabel(customClaims!["role"]),
      icon: customClaims?.["role"] === UserRoleEnum.ADMIN ? "pi pi-shield" : "pi pi-user",
      class:
        customClaims?.["role"] === UserRoleEnum.ADMIN ? "bg-red text-white" : "bg-gray text-white",
    },
  };
}

export function mapFirebaseUsersToRows(user: PartialFirebaseUser[]): FirebaseUserRow[] {
  return user.map(mapFirebaseUserToRow);
}

export function mapUserInviteToRow(invite: UserInvite): FirebaseUserRow {
  const { email, role } = invite;

  return {
    uid: invite.uid,
    displayName: "Invitation en attente",
    email: email || "Aucun e-mail défini",
    status: UserStatusEnum.INVITED,
    role: role,
    statusChip: {
      label: "Invité",
      icon: "pi pi-clock",
      class: "bg-blue text-white",
    },
    roleChip: {
      label: getUserRoleLabel(role),
      icon: role === UserRoleEnum.ADMIN ? "pi pi-shield" : "pi pi-user",
      class: role === UserRoleEnum.ADMIN ? "bg-red text-white" : "bg-gray text-white",
    },
  };
}

export function mapUserInvitesToRows(invites: UserInvite[]): FirebaseUserRow[] {
  return invites.map(mapUserInviteToRow);
}
