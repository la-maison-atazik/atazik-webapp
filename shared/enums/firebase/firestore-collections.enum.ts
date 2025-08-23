export const enum FirestoreCollectionsEnum {
	/**
	 * Collection for storing admins metadata of the app.
	 * Each document in this collection represents an admin setting or group of settings.
	 */
	ADMIN = "admin",

	/**
	 * Collection for storing invites sent to users.
	 * Each document in this collection represents an invitation sent to a user.
	 * This collection is used to manage user invitations and track their status.
	 */
	PENDING_INVITES = "pendingInvites",

	/**
	 * Collection for storing all responsible.
	 * Each document in this collection represents a responsible.
	 */
	RESPONSIBLE = "responsible",

	/**
	 * Collection for storing all subscribers.
	 * Each document in this collection represents a student.
	 */
	STUDENT = "student",
}
