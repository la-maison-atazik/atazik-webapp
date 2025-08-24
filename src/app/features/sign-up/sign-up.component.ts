import { Component, inject, OnInit } from "@angular/core";
import {
	Auth,
	AuthModule,
	isSignInWithEmailLink,
	signInWithEmailLink,
	updatePassword,
	updateProfile,
} from "@angular/fire/auth";
import { CardModule } from "primeng/card";
import { DividerModule } from "primeng/divider";
import { FloatLabelModule } from "primeng/floatlabel";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { PasswordModule } from "primeng/password";
import { ButtonModule } from "primeng/button";
import { MessageModule } from "primeng/message";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { Ripple } from "primeng/ripple";
import { InputText } from "primeng/inputtext";
import { doc, Firestore, FirestoreModule, getDoc } from "@angular/fire/firestore";
import { ToastModule } from "primeng/toast";
import { MessageService } from "primeng/api";
import { getUserRoleLabel } from "@shared/utils/user-role.utils";
import { UserInvite } from "@shared/models/user-invite.model";
import { matchFields } from "../../shared/validators/password-confirm.validator";
import { FirestoreCollectionsEnum } from "@shared/enums/firebase/firestore-collections.enum";
import { PASSWORD } from "../../core/constants/regex.constant";

@Component({
	selector: "app-sign-up",
	imports: [
		CardModule,
		DividerModule,
		FloatLabelModule,
		IconFieldModule,
		InputIconModule,
		PasswordModule,
		ButtonModule,
		MessageModule,
		ReactiveFormsModule,
		Ripple,
		InputText,
		ToastModule,
	],
	providers: [AuthModule, FirestoreModule, MessageService],
	templateUrl: "./sign-up.component.html",
	styleUrl: "./sign-up.component.scss",
})
export class SignUpComponent implements OnInit {
	private auth = inject(Auth);
	private firestore = inject(Firestore);
	private formBuilder = inject(FormBuilder);
	private router = inject(Router);
	private messageService = inject(MessageService);

	private readonly url = window.location.href;
	private readonly token = new URL(this.url).searchParams.get("token");

	protected isSignInWithEmailLink = isSignInWithEmailLink(this.auth, window.location.href);

	protected loading = false;
	protected error = "";

	protected readonly formSignUp = this.formBuilder.group(
		{
			firstName: ["", { validators: [Validators.required] }],
			lastName: ["", { validators: [Validators.required] }],
			role: ["", { validators: [Validators.required] }],
			email: ["", { validators: [Validators.required, Validators.email] }],
			password: ["", { validators: [Validators.required, Validators.pattern(PASSWORD)] }],
			confirmPassword: ["", { validators: [Validators.required, Validators.pattern(PASSWORD)] }],
		},
		{
			validators: [matchFields("password", "confirmPassword", "passwordMismatch")],
		},
	);

	public ngOnInit(): void {
		if (!this.isSignInWithEmailLink) {
			this.messageService.add({
				severity: "error",
				summary: "Lien invalide",
				detail: "Le lien de connexion n'est pas valide ou a expiré.",
			});
			this.router.navigate(["/"]);
			return;
		}

		this.updateFormWithPendingInvite();
	}

	private async updateFormWithPendingInvite() {
		if (!this.token) {
			this.messageService.add({
				severity: "error",
				summary: "Erreur",
				detail: "Aucune invitation trouvée pour ce token.",
			});
			this.router.navigate(["/"]);
			return;
		}

		const pendingInvite = await this.pendingInvite;
		if (!pendingInvite || !pendingInvite.expiresAt || pendingInvite.expiresAt < new Date()) {
			this.messageService.add({
				severity: "error",
				summary: "Invitation expirée",
				detail: "Le lien de connexion n'est pas valide ou a expiré.",
			});
			await this.auth.signOut();
			this.router.navigate(["/"]);
			return;
		}

		this.formSignUp.patchValue({
			email: pendingInvite.email,
			role: getUserRoleLabel(pendingInvite.role),
		});

		this.formSignUp.get("email")?.disable();
		this.formSignUp.get("role")?.disable();
	}

	private get pendingInvite(): Promise<UserInvite | null> {
		if (!this.token) {
			return Promise.resolve(null);
		}

		const docRef = doc(this.firestore, `${FirestoreCollectionsEnum.PENDING_INVITES}/${this.token}`);
		return getDoc(docRef).then((doc) => {
			if (doc.exists()) {
				return doc.data() as UserInvite;
			}
			return null;
		});
	}

	protected async onSubmit() {
		if (this.formSignUp.invalid) {
			this.formSignUp.markAllAsTouched();
			return;
		}
		this.error = "";

		const { firstName, lastName, password, confirmPassword } = this.formSignUp.value;

		if (password !== confirmPassword) {
			this.error = "Les mots de passe ne correspondent pas.";
			return;
		}

		if (!this.isSignInWithEmailLink) {
			this.error = "La connexion à expirée ou n'est pas valide.";
			return;
		}
		const pendingInvite = await this.pendingInvite;

		this.loading = true;
		try {
			await signInWithEmailLink(this.auth, pendingInvite!.email, window.location.href);
		} catch (e) {
			await this.auth.signOut();
			console.error("Error signing in with email link:", e);
			this.error = "Une erreur est survenue lors de la connexion. Veuillez réessayer.";
			this.loading = false;
			return;
		}

		try {
			await updateProfile(this.auth.currentUser!, {
				displayName: `${firstName} ${lastName}`,
			});
			await updatePassword(this.auth.currentUser!, password!);
			await this.auth.signOut();
			this.formSignUp.reset();
			this.messageService.add({
				severity: "success",
				summary: "Inscription réussie",
				detail: "Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter.",
			});
			this.router.navigate(["/sign-in"]);
		} catch (error) {
			console.error("Error during sign-up:", error);
			this.error = "Une erreur est survenue. Veuillez réessayer.";
		} finally {
			this.loading = false;
		}
	}
}
