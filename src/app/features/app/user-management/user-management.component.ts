import { Component, inject, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TableModule } from "primeng/table";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { FormsModule } from "@angular/forms";
import { Auth, AuthModule } from "@angular/fire/auth";
import { PartialFirebaseUser } from "../../../core/models/firebase-user.model";
import { Card } from "primeng/card";
import { Toolbar } from "primeng/toolbar";
import { IconField } from "primeng/iconfield";
import { InputIcon } from "primeng/inputicon";
import { UserService } from "../../../core/services/user.service";
import { Ripple } from "primeng/ripple";
import { mapFirebaseUsersToRows, mapUserInvitesToRows } from "../../../core/mappers/user-to-row.mapper";
import { FirebaseUserRow } from "../../../core/models/tables-row/firebase-user-row.model";
import { Chip } from "primeng/chip";
import { InviteUserDialogComponent } from "./invite-user-dialog/invite-user-dialog.component";
import { UserInvite } from "@shared/models/user-invite.model";
import { Tooltip } from "primeng/tooltip";
import { EditRoleDialogComponent } from "./edit-role-dialog/edit-role-dialog.component";
import { ConfirmDialog } from "primeng/confirmdialog";
import { ConfirmationService, MessageService } from "primeng/api";
import { UserStatusEnum } from "@shared/enums/user-status.enum";
import { isUserRoleEqualOrHigher } from "@shared/utils/user-role.utils";
import { ClaimService } from "../../../core/services/claim.service";
import { ToastModule } from "primeng/toast";

@Component({
	selector: "app-user-management",
	imports: [
		CommonModule,
		TableModule,
		ButtonModule,
		InputTextModule,
		FormsModule,
		AuthModule,
		Card,
		Toolbar,
		IconField,
		InputIcon,
		Ripple,
		Chip,
		InviteUserDialogComponent,
		AuthModule,
		Tooltip,
		EditRoleDialogComponent,
		ConfirmDialog,
		ToastModule,
	],
	providers: [ConfirmationService, MessageService],
	templateUrl: "./user-management.component.html",
	styleUrl: "./user-management.component.scss",
})
export class UserManagementComponent implements OnInit {
	private userService = inject(UserService);
	private confirmationService = inject(ConfirmationService);
	private messageService = inject(MessageService);
	private claimService = inject(ClaimService);
	protected auth = inject(Auth);
	protected role = this.claimService.role;

	private usersFirebase: PartialFirebaseUser[] = [];
	private usersInvites: UserInvite[] = [];
	protected userRows: FirebaseUserRow[] = [];
	protected loading = false;

	protected inviteDialogVisible = false;
	protected editRoleDialogVisible = false;

	protected selectedUser = signal<FirebaseUserRow | null>(null);

	ngOnInit(): void {
		this.fetchUsers();
	}

	/**
	 * Fetches users from the user service and maps them to rows for display.
	 */
	async fetchUsers() {
		this.loading = true;

		// Get users from Firebase auth
		await this.userService
			.fetchUsers()
			.then((users) => {
				this.usersFirebase = users;
			})
			.catch((error) => {
				this.messageService.add({
					severity: "error",
					summary: "Erreur de chargement des utilisateurs",
					detail: "Une erreur est survenue lors du chargement des utilisateurs. Veuillez réessayer plus tard.",
				});
				console.error("Error fetching users:", error);
			});

		// Get invites
		await this.userService
			.fetchInvites()
			.then((invites) => {
				this.usersInvites = invites;
			})
			.catch((error) => {
				this.messageService.add({
					severity: "error",
					summary: "Erreur de chargement des invitations",
					detail: "Une erreur est survenue lors du chargement des invitations. Veuillez réessayer plus tard.",
				});
				console.error("Error fetching invites:", error);
			});

		this.userRows = mapFirebaseUsersToRows(this.usersFirebase);
		this.userRows.push(...mapUserInvitesToRows(this.usersInvites));
		this.loading = false;
	}

	protected async reloadData() {
		this.userService.invalidateUsersCache();
		await this.fetchUsers();
	}

	/**
	 * Opens the invite dialog.
	 */
	protected openInviteDialog() {
		this.inviteDialogVisible = true;
	}

	/**
	 * Closes the invite dialog.
	 */
	protected confirmInviteDialog() {
		this.fetchUsers();
		this.messageService.add({
			severity: "success",
			summary: "Invitation envoyée",
			detail: "L'invitation a été envoyée avec succès.",
		});
	}

	protected openEditRoleDialog(user: FirebaseUserRow) {
		this.selectedUser.set(user);
		this.editRoleDialogVisible = true;
	}

	protected openDeleteUserDialog(user: FirebaseUserRow) {
		if (user.status === UserStatusEnum.INVITED) {
			this.confirmationService.confirm({
				message: "Êtes-vous sûr de vouloir supprimer cet invitation ?",
				header: "Suppression d'invitation",
				icon: "pi pi-exclamation-triangle",
				acceptLabel: "Supprimer l'invitation",
				rejectLabel: "Annuler",
				rejectButtonStyleClass: "p-button-secondary",
				accept: () => {
					this.userService
						.deleteUserInvite(user.uid!)
						.then(() => {
							this.messageService.add({
								severity: "success",
								summary: "Invitation supprimée",
								detail: `L'invitation pour ${user.email} a été supprimée avec succès.`,
							});
							this.fetchUsers();
						})
						.catch((error) => {
							this.messageService.add({
								severity: "error",
								summary: "Erreur de suppression",
								detail: `Une erreur est survenue lors de la suppression de l'invitation pour ${user.email}. Veuillez réessayer plus tard.`,
							});
							console.error("Error deleting user:", error);
						});
				},
			});
		} else {
			this.confirmationService.confirm({
				message: "Êtes-vous sûr de vouloir supprimer cet utilisateur ? Il ne pourra plus accèder à l'application.",
				header: "Suppression d'utilisateur",
				icon: "pi pi-exclamation-triangle",
				acceptLabel: "Supprimer l'utilisateur",
				rejectLabel: "Annuler",
				rejectButtonStyleClass: "p-button-secondary",
				accept: () => {
					this.userService
						.deleteAuthUser(user.uid!)
						.then(() => {
							this.messageService.add({
								severity: "success",
								summary: "Utilisateur supprimé",
								detail: `L'utilisateur ${user.email} a été supprimé avec succès.`,
							});
							this.userService.invalidateUsersCache();
							this.fetchUsers();
							this.confirmationService.close();
						})
						.catch((error) => {
							this.messageService.add({
								severity: "error",
								summary: "Erreur de suppression",
								detail: `Une erreur est survenue lors de la suppression de l'utilisateur ${user.email}. Veuillez réessayer plus tard.`,
							});
							console.error("Error deleting user:", error);
							this.confirmationService.close();
						});
				},
			});
		}
	}

	protected reSendInviteEmail(user: FirebaseUserRow) {
		this.confirmationService.confirm({
			message: `Êtes-vous sûr de vouloir renvoyer l'invitation à ${user.email} ?`,
			header: "Renvoyer l'invitation",
			icon: "pi pi-exclamation-triangle",
			acceptLabel: "Renvoyer l'invitation",
			rejectLabel: "Annuler",
			rejectButtonStyleClass: "p-button-secondary",
			accept: () => {
				this.userService
					.resendInvite(user)
					.then(() => {
						this.messageService.add({
							severity: "success",
							summary: "Invitation renvoyée",
							detail: `L'invitation pour ${user.email} a été renvoyée avec succès.`,
						});
						this.fetchUsers();
						this.confirmationService.close();
					})
					.catch((error) => {
						console.error("Error resending invite email:", error);
						this.messageService.add({
							severity: "error",
							summary: "Erreur lors de l'envoi de l'invitation",
							detail: `Une erreur est survenue lors de l'envoi de l'invitation pour ${user.email}. Veuillez réessayer plus tard.`,
						});
						this.confirmationService.close();
					});
			},
		});
	}

	protected readonly UserStatusEnum = UserStatusEnum;
	protected readonly isUserRoleEqualOrHigher = isUserRoleEqualOrHigher;
}
