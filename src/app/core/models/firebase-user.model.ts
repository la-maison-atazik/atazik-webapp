export interface FirebaseUser {
  uid: string;
  email?: string;
  emailVerified: boolean;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  customClaims?: Record<string, never>;
}

export type PartialFirebaseUser = Partial<FirebaseUser>;
