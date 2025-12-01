export const enum CloudFunctionsEnum {
  /**
   * Cloud function to invite a new user in the Firebase Authentication system.
   * This function is triggered when a president or more invite a user.
   * It sends an email to the user with an invitation link.
   * The user can then create an account using this link.
   */
  INVITE_USER_BY_EMAIL = "inviteUserByEmail",

  /**
   * Cloud function to get all users in Firebase Auth.
   * This function is triggered before a user is created in Firebase Authentication.
   * This function is triggered when a president or more visit the user management page.
   */
  GET_ALL_USERS = "getAllUsers",

  /**
   * Cloud function to edit user claim role in Firebase Auth.
   * This function is triggered when a president or more edit a user role.
   */
  EDIT_USER_ROLE = "editUserRole",

  /**
   * Cloud function to resend an invite to a user.
   * This function is triggered when a president or more resend an invite to a user.
   */
  RESEND_INVITE_USER = "resendInviteUser",

  /**
   * Cloud function to delete a user in Firebase Auth.
   * This function is triggered when a president or more delete a user.
   */
  DELETE_AUTH_USER = "deleteAuthUser",
}
