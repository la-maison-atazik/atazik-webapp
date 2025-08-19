import { Component, inject, OnInit, signal } from "@angular/core";
import { ConfirmDialog } from "primeng/confirmdialog";
import { ToastModule } from "primeng/toast";
import { ButtonModule } from "primeng/button";
import { Ripple } from "primeng/ripple";
import { ToolbarModule } from "primeng/toolbar";
import { CardModule } from "primeng/card";
import { ConfirmationService, MessageService } from "primeng/api";
import { AccordionModule } from "primeng/accordion";
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { InputTextModule } from "primeng/inputtext";
import { FloatLabelModule } from "primeng/floatlabel";
import { DatePickerModule } from "primeng/datepicker";
import { CheckboxModule } from "primeng/checkbox";
import { CommonModule } from "@angular/common";
import { consentsMandatory } from "../../../shared/validators/consents-mandatory.validator";
import { Auth } from "@angular/fire/auth";
import { ACTIVITIES_CATALOG } from "../../../core/constants/activities.constant";
import { MessageModule } from "primeng/message";
import { SelectModule } from "primeng/select";
import { ChipModule } from "primeng/chip";
import { Textarea } from "primeng/textarea";
import { Firestore } from "@angular/fire/firestore";
import { ActivityOption } from "../../../core/models/activity-option.model";
import { subscriberFromFormRegistration } from "../../../core/models/subscriber.model";

export type PaymentMethod = "" | "1x" | "3x" | "10x";
export type MeanOfPayment = "virement" | "cheque" | "ancv" | "chequier_jeune";

@Component({
	selector: "app-new-registration",
	imports: [
		CommonModule,
		ConfirmDialog,
		ToastModule,
		ButtonModule,
		Ripple,
		ToolbarModule,
		CardModule,
		AccordionModule,
		ReactiveFormsModule,
		InputTextModule,
		FloatLabelModule,
		DatePickerModule,
		CheckboxModule,
		FormsModule,
		MessageModule,
		SelectModule,
		ChipModule,
		Textarea,
	],
	providers: [ConfirmationService, MessageService],
	templateUrl: "./new-registration.component.html",
	styleUrl: "./new-registration.component.scss",
})
export class NewRegistrationComponent implements OnInit {
	private confirmationService = inject(ConfirmationService);
	private messageService = inject(MessageService);
	private formBuilder = inject(FormBuilder);
	private auth = inject(Auth);
	private firestore = inject(Firestore);

	// Paramètres
	protected readonly subscriptionCost = 10; // €
	protected readonly discountThreshold = 3; // nb d'activités pour déclencher la remise
	protected readonly discountRate = 0.04; // 4%

	protected readonly catalog = ACTIVITIES_CATALOG;

	protected hasData = false;

	protected formControlMeanOfPayment = this.formBuilder.control<MeanOfPayment[]>([]);

	protected registrationForm = this.formBuilder.group({
		student: this.formBuilder.group({
			firstName: ["", [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
			lastName: ["", [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
			birthDate: [null, [Validators.required]],
		}),
		responsible: this.formBuilder.group({
			isStudentResponsible: [false],
			firstName: ["", [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
			lastName: ["", [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
			email: ["", [Validators.required, Validators.email]],
			phone: ["", [Validators.required, Validators.pattern(/^\d{10}$/)]], // 10 chiffres
			address: ["", [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
			postalCode: ["", [Validators.required, Validators.pattern(/^\d{5}$/)]], // 5 chiffres
			city: ["", [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
		}),
		activities: this.formBuilder.array([] satisfies FormGroup[]),
		payment: this.formBuilder.group({
			meanOfPayment: this.formControlMeanOfPayment,
			method: ["" satisfies PaymentMethod, [Validators.required]],
		}),
		consents: this.formBuilder.group(
			{
				imageRight: [false],
				insuranceRC: [false, [Validators.requiredTrue]],
				internalRules: [false, [Validators.requiredTrue]],
				helpEvent: [false],
			},
			{ validators: consentsMandatory },
		),
		comments: ["", [Validators.maxLength(500)]],
		audit: this.formBuilder.group({
			createdAt: [{ value: new Date(), disabled: true }],
			createdBy: [{ value: this.auth.currentUser!.displayName!, disabled: true }],
			updatedAt: [{ value: "", disabled: true }],
			updatedBy: [{ value: "", disabled: true }],
		}),
	});

	get activities(): FormArray<FormGroup> {
		return this.registrationForm.get("activities") as FormArray<FormGroup>;
	}

	get meanOfPaymentOptions(): { label: string; value: MeanOfPayment }[] {
		return [
			{ label: "Virement (à effectuer avant le 15 du mois en cours)", value: "virement" },
			{ label: "Chèque", value: "cheque" },
			{ label: "Chèque ANCV", value: "ancv" },
			{ label: "Chèque Jeune", value: "chequier_jeune" },
		];
	}

	protected get paymentMethods(): { label: string; value: PaymentMethod }[] {
		return [
			{ label: "Choix à faire", value: "" },
			{ label: "Paiement en une fois (Septembre)", value: "1x" },
			{ label: "Paiement en 3 fois (Sept / Déc / Mar)", value: "3x" },
			{ label: "Paiement en 10 fois (Sept → Juin)", value: "10x" },
		];
	}

	nbActivities = signal(0);
	totalActivities = signal(0);
	discount = signal(0);
	total = signal(0);

	public ngOnInit() {
		this.registrationForm.valueChanges.subscribe((values) => {
			this.hasData = Object.values(values).some((val) => val && val.toString().trim() !== "");
		});

		this.registrationForm.get("student.birthDate")?.valueChanges.subscribe((birthDate) => {
			if (birthDate) {
				const age = this.calculateAge(birthDate);
				this.registrationForm.patchValue({
					responsible: {
						isStudentResponsible: age >= 18,
					},
				});
			}
		});

		this.registrationForm.get("responsible.isStudentResponsible")?.valueChanges.subscribe((isResponsible) => {
			if (isResponsible) {
				this.registrationForm
					.get("responsible.firstName")
					?.patchValue(this.registrationForm.get("student.firstName")!.value!);
				this.registrationForm
					.get("responsible.lastName")
					?.patchValue(this.registrationForm.get("student.lastName")!.value!);
			} else {
				this.registrationForm.get("responsible.firstName")?.patchValue("");
				this.registrationForm.get("responsible.lastName")?.patchValue("");
			}
		});

		this.addActivity();
		this.updateTotals();
	}

	protected addActivity() {
		this.activities.push(
			this.formBuilder.group({
				id: ["", Validators.required],
				forfait: [{ value: "", disabled: true }, [Validators.required]],
				teacher: ["", Validators.required],
				price: [{ value: 0, disabled: true }, [Validators.required, Validators.min(0)]],
			}),
		);
		this.updateTotals();
	}

	protected removeActivity(index: number) {
		this.activities.removeAt(index);
		this.updateTotals();
	}

	protected onSubmit(): void {
		if (this.registrationForm.invalid) {
			this.registrationForm.markAsTouched();
			return;
		}

		console.log(subscriberFromFormRegistration(this.registrationForm.getRawValue()));
	}

	protected goBack() {
		if (this.hasData) {
			this.confirmationService.confirm({
				message: "Vous avez des modifications non enregistrées. Voulez-vous vraiment revenir en arrière ?",
				header: "Confirmation",
				icon: "pi pi-exclamation-triangle",
				acceptLabel: "Oui",
				rejectLabel: "Non",
				rejectButtonStyleClass: "p-button-secondary",
				accept: () => {
					this.onCancel();
					window.history.back();
				},
			});
		} else {
			window.history.back();
		}
	}

	protected calculateAge(birthDate: Date): number {
		if (!birthDate) return 0;
		const today = new Date();
		let age = today.getFullYear() - birthDate.getFullYear();
		const monthDiff = today.getMonth() - birthDate.getMonth();
		const dayDiff = today.getDate() - birthDate.getDate();
		if (monthDiff < 0 || (monthDiff === 0 && dayDiff > 0)) {
			age--;
		}
		return age;
	}

	protected onActivityChange(activity: FormGroup) {
		activity.patchValue({ forfait: "", price: 0 });
		if (activity.get("id")?.value !== "") {
			activity.get("forfait")?.enable();
		}
	}

	protected forfaitsForActivity(index: number): ActivityOption[] | null {
		const cat = this.activities.at(index).get("id")?.value as string;
		const found = this.catalog.find((c) => c.id === cat);
		return found ? found.options : null;
	}

	protected onForfaitChange(activity: FormGroup) {
		const activityId = activity.get("id")?.value as string;
		const forfait = activity.get("forfait")?.value as string;
		const opt = this.catalog
			.find((c) => c.id === activityId)
			?.options.find((o: { label: string }) => o.label === forfait);
		activity.get("price")?.setValue(opt?.price ?? 0, { emitEvent: false });
		this.updateTotals();
	}

	private updateTotals() {
		const activities = this.activities.controls;
		this.nbActivities.set(activities.length);
		this.totalActivities.set(activities.reduce((total, activity) => total + (activity.get("price")?.value ?? 0), 0));
		this.discount.set(this.nbActivities() >= this.discountThreshold ? this.totalActivities() * this.discountRate : 0);
		this.total.set(this.subscriptionCost + this.totalActivities() - this.discount());
	}

	private onCancel() {
		this.registrationForm.reset();
		this.activities.clear();
		this.addActivity();
		this.updateTotals();
		this.hasData = false;
	}
}
