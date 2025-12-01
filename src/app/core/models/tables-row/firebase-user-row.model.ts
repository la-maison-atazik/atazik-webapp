import { PrimeChipProperties } from "../prime-chip-properties.model";

export interface FirebaseUserRow {
  uid?: string;
  displayName: string;
  email: string;
  status?: string;
  role?: string;
  statusChip: PrimeChipProperties;
  roleChip: PrimeChipProperties;
}
