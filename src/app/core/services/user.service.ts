import { inject, Injectable } from "@angular/core";
import { Functions, FunctionsModule, httpsCallable } from "@angular/fire/functions";
import { PartialFirebaseUser } from "../models/firebase-user.model";
import {
  collection,
  deleteDoc,
  doc,
  Firestore,
  FirestoreModule,
  getDoc,
  getDocs,
} from "@angular/fire/firestore";
import { SecureStorageService } from "./secure-storage.service";
import { CloudFunctionsEnum } from "../enums/firebase/cloud-functions.enums";
import { UserInvite } from "@shared/models/user-invite.model";
import { FirestoreCollectionsEnum } from "@shared/enums/firebase/firestore-collections.enum";

@Injectable({ providedIn: "root", deps: [FunctionsModule, FirestoreModule] })
export class UserService {
  private functions = inject(Functions);
  private firestore = inject(Firestore);
  private secureStorageService = inject(SecureStorageService);

  private readonly userAuthVersionStorageKey = "userAuthVersion";
  private readonly firebaseUsersStorageKey = "firebaseUsers";

  /**
   * Invites a user by email and role.
   * This method creates a new user invite in Firebase Firestore.
   * @param userInvite The UserInvite object containing the email and role of the user to invite.
   */
  async inviteUserByEmail(userInvite: UserInvite): Promise<void> {
    if (!userInvite.email || !userInvite.role) {
      throw new Error("Email and intended role are required to invite a user.");
    }

    const inviteUserFunction = httpsCallable(
      this.functions,
      CloudFunctionsEnum.INVITE_USER_BY_EMAIL,
    );
    await inviteUserFunction(userInvite).catch((error) => {
      console.error("Error inviting user:", error);
      throw new Error("Failed to invite user");
    });
  }

  /**
   * Fetches invites from Firebase Firestore.
   */
  async fetchInvites(): Promise<UserInvite[]> {
    const getInvites = collection(this.firestore, FirestoreCollectionsEnum.PENDING_INVITES);
    const querySnapshot = await getDocs(getInvites);
    const invites: UserInvite[] = [];
    querySnapshot.forEach((doc) => {
      const validInvite = doc.data() as UserInvite;
      validInvite.uid = doc.id;
      invites.push(validInvite);
    });
    return invites;
  }

  /**
   * Fetches users from Firebase or local storage based on the version index.
   * If the version in local storage is less than the version in Firebase, it fetches from Firebase.
   * Otherwise, it retrieves users from local storage.
   */
  async fetchUsers(): Promise<PartialFirebaseUser[]> {
    const firestoreUserAuthVersionStorage = this.firestoreUserAuthVersionFromStorage;
    const firestoreUserAuthVersionFirebase = await this.firestoreUserAuthVersionIndex;

    if (firestoreUserAuthVersionStorage === firestoreUserAuthVersionFirebase) {
      const usersStorage = await this.usersStorage;
      if (usersStorage) {
        return usersStorage;
      }
    }
    const usersFirebase = await this.fetchUsersFromFirebase();
    this.usersStorage = usersFirebase;
    this.firestoreUserAuthVersionToStorage = firestoreUserAuthVersionFirebase;
    return usersFirebase;
  }

  /**
   * Fetches users from Firebase using a callable function.
   * This function retrieves all users and maps them to PartialFirebaseUser objects.
   */
  private async fetchUsersFromFirebase(): Promise<PartialFirebaseUser[]> {
    let result: PartialFirebaseUser[] = [];
    const getAllUsers = httpsCallable(this.functions, CloudFunctionsEnum.GET_ALL_USERS);
    await getAllUsers()
      .then((response) => {
        if (response.data && Array.isArray(response.data)) {
          result = response.data.map((user) => {
            return user as PartialFirebaseUser;
          });
        }
      })
      .catch((error) => {
        console.error("Error fetching users:", error);
        throw new Error("Failed to fetch users");
      });

    return result;
  }

  public invalidateUsersCache(): void {
    // Clear the local storage cache for user authentication version
    localStorage.removeItem(this.userAuthVersionStorageKey);
    // Clear the secure storage cache for users
    this.secureStorageService.removeItem(this.firebaseUsersStorageKey);
  }

  /**
   * Resend an invitation to a user.
   * This method checks if the invite exists before attempting to resend it.
   * If the invite does not exist, it throws an error.
   * If the invite exists, it calls the inviteUserByEmail function to resend the invite
   * and updates the invite's timestamp.
   */
  public async resendInvite(invite: UserInvite): Promise<void> {
    if (!invite || !invite.email || !invite.uid) {
      throw new Error("Invite must contain an email and an uid to resend.");
    }

    const docRef = doc(this.firestore, FirestoreCollectionsEnum.PENDING_INVITES, invite.uid!);
    const docSnapshot = await getDoc(docRef);
    if (!docSnapshot.exists()) {
      throw new Error("Invite does not exist");
    }

    // Call the cloud function to resend the invite
    const resendInviteFunction = httpsCallable(
      this.functions,
      CloudFunctionsEnum.RESEND_INVITE_USER,
    );
    await resendInviteFunction(invite).catch((error) => {
      console.error("Error resending invite:", error);
      throw new Error("Failed to resend invite");
    });
  }

  /**
   * Deletes a user invite from Firestore.
   * This method checks if the invite exists before attempting to delete it.
   * If the invite does not exist, it throws an error.
   * If the invite exists, it deletes the invite document from Firestore.
   */
  public async deleteUserInvite(inviteId: string): Promise<void> {
    const docRef = doc(this.firestore, FirestoreCollectionsEnum.PENDING_INVITES, inviteId);
    return getDoc(docRef)
      .then(async (doc) => {
        if (doc.exists()) {
          try {
            return await deleteDoc(docRef);
          } catch (error) {
            console.error("Error deleting user invite:", error);
            throw new Error("Failed to delete user invite");
          }
        } else {
          throw new Error("Invite does not exist");
        }
      })
      .catch((error) => {
        console.error("Error fetching user invite:", error);
        throw new Error("Failed to fetch user invite");
      });
  }

  public async deleteAuthUser(uid: string): Promise<void> {
    const deleteUserFunction = httpsCallable(this.functions, CloudFunctionsEnum.DELETE_AUTH_USER);
    await deleteUserFunction({ uid });
  }

  /**
   * Retrieves the user authentication version index from Firestore.
   */
  private get firestoreUserAuthVersionIndex(): Promise<number> {
    const docRef = doc(this.firestore, FirestoreCollectionsEnum.ADMIN, "global");
    return getDoc(docRef).then((doc): number => {
      if (doc.exists()) {
        return doc.data()["userAuthVersion"] || 0;
      }
      return 0;
    });
  }

  /**
   * Retrieves the user authentication version from local storage.
   * @return The version number from local storage or 0 if not found.
   */
  private get firestoreUserAuthVersionFromStorage(): number {
    const version = localStorage.getItem(this.userAuthVersionStorageKey);
    return version ? parseInt(version, 10) : 0;
  }

  /**
   * Sets the user authentication version in local storage.
   * @param version The version number to set.
   */
  private set firestoreUserAuthVersionToStorage(version: number) {
    localStorage.setItem(this.userAuthVersionStorageKey, version.toString());
  }

  /**
   * Stores the fetched users in secure storage.
   * This method is used to cache users locally for faster access.
   * @param users The array of PartialFirebaseUser objects to store.
   */
  private set usersStorage(users: PartialFirebaseUser[]) {
    this.secureStorageService.setItem(this.firebaseUsersStorageKey, users, 999999999);
  }

  /**
   * Retrieves the stored users from secure storage.
   * This method is used to access cached users.
   * @returns A promise that resolves to an array of PartialFirebaseUser objects.
   */
  private get usersStorage(): Promise<PartialFirebaseUser[] | null> {
    return this.secureStorageService.getItem(this.firebaseUsersStorageKey);
  }
}
