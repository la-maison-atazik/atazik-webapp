import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { ActionCodeSettings, getAuth, UserRecord } from "firebase-admin/auth";
import { defineSecret, defineString } from "firebase-functions/params";
import nodemailer from "nodemailer";
import { v4 as uuidv4 } from "uuid";
import { UserRoleEnum } from "./shared/enums/user-roles.enum";
import { UserStatusEnum } from "./shared/enums/user-status.enum";
import { FirestoreCollectionsEnum } from "./shared/enums/firebase/firestore-collections.enum";
import { getUserRoleLabel, isUserRoleEqualOrHigher } from "./shared/utils/user-role.utils";

admin.initializeApp();
functions.setGlobalOptions({ maxInstances: 10, region: "europe-west9" });

// Add env variables for email configuration
const emailSignUpLink = defineString("EMAIL_SIGNUP_LINK");
const emailUser = defineString("EMAIL_USER");
const emailHost = defineString("EMAIL_HOST");
const emailPort = defineString("EMAIL_PORT");
const emailPass = defineSecret("EMAIL_PASS");
const appName = defineString("APP_NAME");
const ownerEmail = defineString("OWNER_EMAIL");

// Configuration for nodemailer
const transporter = (pass: string) =>
	nodemailer.createTransport({
		host: emailHost.value(),
		port: Number.parseInt(emailPort.value()),
		secure: true,
		auth: {
			user: emailUser.value(),
			pass: pass,
		},
	});

/**
 * Recursively lists all users in Firebase Authentication.
 * This function handles pagination by checking for a nextPageToken.
 * It retrieves up to 1000 users at a time and continues to fetch more users
 * until there are no more users to fetch.
 * @param nextPageToken
 */
async function listAllUsers(nextPageToken?: string) {
	const result = await getAuth().listUsers(1000, nextPageToken);
	const users = result.users;
	if (result.pageToken) {
		const more: UserRecord[] = await listAllUsers(result.pageToken);
		return users.concat(more);
	}
	return users;
}

/**
 * Cloud Function to get all users from Firebase Authentication.
 * This function is callable via HTTPS and returns a list of user records.
 * Each user record includes basic information such as uid, email, displayName, etc.
 * Minimum role required to call this function is PRESIDENT.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getAllUsers = functions.https.onCall(async (request, response) => {
	if (!isAuthorized(request, UserRoleEnum.PRESIDENT)) {
		throw new functions.https.HttpsError(
			"unauthenticated",
			"Seuls les utilisateurs authentifiés et administrateurs peuvent accéder à cette fonction.",
		);
	}

	const userRecords = await listAllUsers();
	return userRecords.map((u) => {
		return {
			uid: u.uid,
			email: u.email,
			displayName: u.displayName,
			photoURL: u.photoURL,
			phoneNumber: u.phoneNumber,
			emailVerified: u.emailVerified,
			customClaims: u.customClaims || {},
		};
	});
});

/**
 * Cloud Function to add default claims to a user when they are created and block if needed.
 * This function is triggered before a user is created in Firebase Authentication.
 * It sets the role and status for the user.
 * Get the pending invite for the user and delete it.
 * It also updates the user auth version in Firestore.
 */
export const beforeCreateAuthUser = functions.identity.beforeUserCreated(async (authEvent) => {
	const user = authEvent.data;
	if (!user) {
		throw new functions.https.HttpsError("invalid-argument", "No use found in auth event data");
	}

	const email = user.email?.toLowerCase().trim();
	if (!email) {
		throw new functions.https.HttpsError("invalid-argument", "L'e-mail de l'utilisateur est requis.");
	}

	const pendingInvitesCollection = admin.firestore().collection(FirestoreCollectionsEnum.PENDING_INVITES);
	const pendingInviteDoc = await pendingInvitesCollection.where("email", "==", email).limit(1).get();

	if (pendingInviteDoc.empty) {
		// If no pending invite, block the user creation
		throw new functions.https.HttpsError("failed-precondition", "Aucun utilisateur en attente d'invitation trouvé.");
	}

	// Delete the pending invite if it exists
	const pendingInviteId = pendingInviteDoc.docs[0].id;
	await pendingInvitesCollection
		.doc(pendingInviteId)
		.delete()
		.catch((error) => {
			console.error("Error deleting pending invite:", error);
			throw new functions.https.HttpsError("internal", "Erreur lors de la suppression de l'invitation en attente.");
		});

	const docData = pendingInviteDoc.docs[0].data();
	if (docData["expiresAt"] < Date.now()) {
		throw new functions.https.HttpsError("failed-precondition", "L'invitation a expiré.");
	}

	// Set default custom claims for the user
	if (!user.customClaims) {
		user.customClaims = {};
	}
	user.customClaims.role = pendingInviteDoc.docs[0].data()!["role"];
	user.customClaims.status = UserStatusEnum.ACTIVATED;

	// Update user auth version in Firestore
	const docRef = admin.firestore().doc(`${FirestoreCollectionsEnum.ADMIN}/global`);
	docRef.update({ userAuthVersion: admin.firestore.FieldValue.increment(1) }).catch((error) => {
		console.error("Error updating user auth version:", error);
	});

	return {
		customClaims: user.customClaims,
	};
});

/**
 * Cloud Function to invite a user by email.
 * This function is callable via HTTPS and allows an authenticated user (an admin or president)
 * to invite another user by sending an email with a sign-in link.
 * The invited user can then create an account.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const inviteUserByEmail = functions.https.onCall({ secrets: [emailPass] }, async (request, response) => {
	if (!isAuthorized(request, UserRoleEnum.PRESIDENT)) {
		throw new functions.https.HttpsError(
			"unauthenticated",
			"Seuls les utilisateurs authentifiés et administrateurs peuvent inviter.",
		);
	}

	let { email, role } = request.data;

	if (!email || !role) {
		throw new functions.https.HttpsError("invalid-argument", "L'e-mail et le rôle sont requis.");
	}
	email = email.toLowerCase().trim();
	role = role.toLowerCase().trim();

	const token = uuidv4();

	try {
		// Save the pending invite in Firestore
		await admin
			.firestore()
			.collection(FirestoreCollectionsEnum.PENDING_INVITES)
			.doc(token)
			.set({
				email: email,
				role: role,
				status: UserStatusEnum.INVITED,
				createdAt: admin.firestore.FieldValue.serverTimestamp(),
				expiresAt: Date.now() + 60 * 60 * 1000, // expire dans 1 heure
			});

		// Générer le lien de connexion/création d'e-mail
		const actionCodeSettings: ActionCodeSettings = {
			url: emailSignUpLink.value() + `?token=${token}`,
			handleCodeInApp: true,
		};

		const link = await admin.auth().generateSignInWithEmailLink(email, actionCodeSettings);

		// Envoyer l'e-mail à l'utilisateur
		await transporter(emailPass.value()).sendMail({
			from: emailUser.value(),
			to: email,
			subject: `Invitation à rejoindre ${appName.value()}`,
			html: `
        <p>Bonjour,</p>
        <p>Vous avez été invité à créer un compte sur ${appName.value()} avec le rôle ${getUserRoleLabel(role)}.</p>
        <p>Cliquez sur le lien ci-dessous pour finaliser la création de votre compte :</p>
        <p><a href="${link}">Finaliser l'inscription</a></p>
        <p>Ce lien expirera dans une heure. Ne le partagez pas.</p>
        <p>Cordialement,</p>
        <p>L'équipe ${appName.value()}</p>
      `,
		});

		return { success: true, message: "Invitation envoyée avec succès." };
	} catch (error) {
		if (error instanceof functions.https.HttpsError) {
			throw error; // Re-jeter l'erreur HttpsError
		}

		throw new functions.https.HttpsError(
			"internal",
			"Une erreur inattendue est survenue lors de l'envoi de l'invitation.",
		);
	}
});

/**
 * Cloud Function to edit a user's role.
 * This function is callable via HTTPS and allows an authenticated user (an admin or president)
 * to change the role of another user.
 * It checks if the requester has the right permissions to change the role.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const editUserRole = functions.https.onCall(async (request, response) => {
	if (!isAuthorized(request, UserRoleEnum.PRESIDENT)) {
		throw new functions.https.HttpsError(
			"unauthenticated",
			"Seuls les utilisateurs authentifiés et administrateurs peuvent modifier le rôle d'un utilisateur.",
		);
	}

	const { uid, role } = request.data;

	if (!uid || !role) {
		throw new functions.https.HttpsError("invalid-argument", "L'UID et le rôle sont requis.");
	}

	if (!Object.values(UserRoleEnum).includes(role)) {
		throw new functions.https.HttpsError("invalid-argument", "Rôle invalide.");
	}

	const user = await getAuth()
		.getUser(uid)
		.catch((error) => {
			console.error("Error fetching user:", error);
			throw new functions.https.HttpsError("not-found", "Utilisateur non trouvé.");
		});

	if (isUserRoleEqualOrHigher(request.auth?.token["role"], user.customClaims!["role"])) {
		throw new functions.https.HttpsError(
			"failed-precondition",
			"Vous ne pouvez pas rétrograder un utilisateur à un rôle égal ou supérieur au vôtre.",
		);
	}

	try {
		// Set the custom claims for the user
		await getAuth().setCustomUserClaims(uid, { role: role, status: UserStatusEnum.ACTIVATED });

		// Update user auth version in Firestore
		const docRef = admin.firestore().doc(`${FirestoreCollectionsEnum.ADMIN}/global`);
		await docRef.update({ userAuthVersion: admin.firestore.FieldValue.increment(1) });

		return { success: true, message: "Rôle de l'utilisateur modifié avec succès." };
	} catch (error) {
		console.error("Error updating user role:", error);
		throw new functions.https.HttpsError("internal", "Erreur lors de la modification du rôle de l'utilisateur.");
	}
});

/**
 * Cloud Function to delete a user.
 * This function is callable via HTTPS and allows an authenticated user (an admin or president)
 * to delete a user by their UID.
 * It checks if the requester has the right permissions to delete the user.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const deleteAuthUser = functions.https.onCall(async (request, response) => {
	if (!isAuthorized(request, UserRoleEnum.PRESIDENT)) {
		throw new functions.https.HttpsError(
			"unauthenticated",
			"Seuls les utilisateurs authentifiés et administrateurs peuvent supprimer un utilisateur.",
		);
	}

	const { uid } = request.data;

	if (!uid) {
		throw new functions.https.HttpsError("invalid-argument", "L'UID de l'utilisateur est requis.");
	}

	const user = await getAuth()
		.getUser(uid)
		.catch((error) => {
			console.error("Error fetching user:", error);
			throw new functions.https.HttpsError("not-found", "Utilisateur non trouvé.");
		});

	if (
		isUserRoleEqualOrHigher(request.auth?.token["role"], user.customClaims!["role"]) &&
		request.auth?.token.email !== ownerEmail.value()
	) {
		throw new functions.https.HttpsError(
			"failed-precondition",
			"Vous ne pouvez pas rétrograder un utilisateur à un rôle égal ou supérieur au vôtre.",
		);
	}

	try {
		await getAuth().deleteUser(uid);
		return { success: true, message: "Utilisateur supprimé avec succès." };
	} catch (error) {
		console.error("Error deleting user:", error);
		throw new functions.https.HttpsError("internal", "Erreur lors de la suppression de l'utilisateur.");
	}
});

/**
 * Cloud Function to resend an invite to a user.
 * This function is callable via HTTPS and allows an authenticated user (an admin or president)
 * to resend an invitation to a user by their email and UID.
 * It checks if the requester has the right permissions to resend the invite.
 * If the invite exists, it generates a new sign-in link and sends it to the user
 * via email.
 * If the invite does not exist, it throws an error.
 * The email is sent using nodemailer with the configuration defined in the environment variables.
 * The email contains a link to finalize the account creation.
 * The link expires after a certain time (1 day).
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const resendInviteUser = functions.https.onCall({ secrets: [emailPass] }, async (request, response) => {
	if (!isAuthorized(request, UserRoleEnum.PRESIDENT)) {
		throw new functions.https.HttpsError(
			"unauthenticated",
			"Seuls les utilisateurs authentifiés et administrateurs peuvent renvoyer une invitation.",
		);
	}

	const { email, uid } = request.data;
	if (!email || !uid) {
		throw new functions.https.HttpsError("invalid-argument", "L'e-mail et l'UID sont requis.");
	}

	const pendingInviteDoc = await admin.firestore().collection(FirestoreCollectionsEnum.PENDING_INVITES).doc(uid).get();
	if (!pendingInviteDoc.exists) {
		throw new functions.https.HttpsError("not-found", "Aucune invitation en attente trouvée pour cet utilisateur.");
	}

	const pendingInviteData = pendingInviteDoc.data();
	if (!pendingInviteData || pendingInviteData.email !== email) {
		throw new functions.https.HttpsError("not-found", "Aucune invitation en attente trouvée pour cet e-mail.");
	}

	// Générer le lien de connexion/création d'e-mail
	const actionCodeSettings: ActionCodeSettings = {
		url: emailSignUpLink.value() + `?token=${uid}`,
		handleCodeInApp: true,
	};

	const link = await admin.auth().generateSignInWithEmailLink(email, actionCodeSettings);
	// Envoyer l'e-mail à l'utilisateur
	await transporter(emailPass.value()).sendMail({
		from: emailUser.value(),
		to: email,
		subject: `Rappel d'invitation à rejoindre ${appName.value()}`,
		html: `
				<p>Bonjour,</p>
				<p>Vous avez été invité à créer un compte sur ${appName.value()} avec le rôle ${getUserRoleLabel(pendingInviteData.role)}.</p>
				<p>Cliquez sur le lien ci-dessous pour finaliser la création de votre compte :</p>
				<p><a href="${link}">Finaliser l'inscription</a></p>
				<p>Ce lien expirera dans une heure. Ne le partagez pas.</p>
				<p>Cordialement,</p>
				<p>L'équipe ${appName.value()}</p>
			`,
	});

	// Update the pending invite with a new expiration date
	await admin
		.firestore()
		.collection(FirestoreCollectionsEnum.PENDING_INVITES)
		.doc(uid)
		.update({
			expiresAt: Date.now() + 60 * 60 * 1000, // expire dans 1 heure
		})
		.catch((error) => {
			console.error("Error updating pending invite expiration:", error);
			throw new functions.https.HttpsError("internal", "Erreur lors de la mise à jour de l'invitation en attente.");
		});

	return { success: true, message: "Invitation renvoyée avec succès." };
});

/**
 * Check if the user is authorized to perform an action based on their role.
 * This function checks if the user is authenticated and if their role is equal to or higher than
 * the required role.
 * It also allows the owner of the application to bypass role checks.
 */
function isAuthorized(request: functions.https.CallableRequest, roleRequired: UserRoleEnum): boolean {
	return (
		(request.auth && request.auth.token && isUserRoleEqualOrHigher(roleRequired, request.auth.token.role)) ||
		request.auth?.token.email === ownerEmail.value()
	);
}
