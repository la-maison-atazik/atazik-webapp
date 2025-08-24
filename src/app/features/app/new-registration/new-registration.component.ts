import { Component, inject, OnDestroy, OnInit, signal } from "@angular/core";
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
import { SelectChangeEvent, SelectModule } from "primeng/select";
import { ChipModule } from "primeng/chip";
import { Textarea } from "primeng/textarea";
import { addDoc, collection, Firestore } from "@angular/fire/firestore";
import { ActivityOption } from "../../../core/models/activity-option.model";
import { studentFromFormRegistration } from "../../../core/models/student.model";
import { calculateAge } from "@shared/utils/age.utils";
import { FirestoreCollectionsEnum } from "@shared/enums/firebase/firestore-collections.enum";
import { responsibleFromFormRegistration } from "../../../core/models/responsible.model";
import { Subscription } from "rxjs";
import { ResponsibleService } from "../../../core/services/responsible.service";
import { Divider } from "primeng/divider";

export type PaymentMethod = "" | "1x" | "3x" | "10x";
export type MeanOfPayment = "virement" | "cheque" | "ancv" | "chequier_jeune";

@Component({
	selector: "app-new-registration",
	imports: [
		CommonModule,
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
		Divider,
	],
	templateUrl: "./new-registration.component.html",
	styleUrl: "./new-registration.component.scss",
})
export class NewRegistrationComponent implements OnInit, OnDestroy {
	private confirmationService = inject(ConfirmationService);
	private messageService = inject(MessageService);
	private formBuilder = inject(FormBuilder);
	private auth = inject(Auth);
	private firestore = inject(Firestore);
	private responsibleService = inject(ResponsibleService);

	// Les subscriptions à nettoyer à la destruction du composant pour éviter les fuites mémoires
	private readonly subscriptions: Subscription[] = [];

	// Paramètres de tarification
	protected readonly subscriptionCost = 10; // €
	protected readonly discountThreshold = 3; // nb d'activités pour déclencher la remise
	protected readonly discountRate = 0.04; // 4%

	protected readonly catalog = ACTIVITIES_CATALOG;

	protected hasData = false;
	protected loading = false;

	protected currentYearString = "";

	// Séparé pour la génération dynamique dans le DOM
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

	private fetchResponsibleTimeout?: number | undefined;
	private _possibleResponsibleList: { uid?: string; displayName: string; email: string }[] = [
		{ uid: "", displayName: "Aucun responsable existant trouvé", email: "" },
	];
	set possibleResponsibleList(value) {
		this._possibleResponsibleList = value;
		this._possibleResponsibleList.push({
			uid: undefined,
			displayName: value.length === 0 ? "Aucun responsable existant trouvé" : "Aucun de ces responsables",
			email: "",
		});
		this._possibleResponsibleList = this._possibleResponsibleList.sort((a, b) =>
			a.displayName.localeCompare(b.displayName),
		);
	}

	get possibleResponsibleList() {
		return this._possibleResponsibleList;
	}
	protected possibleResponsibleSelected?: { uid?: string; displayName: string; email: string };

	nbActivities = signal(0);
	totalActivities = signal(0);
	discount = signal(0);
	total = signal(0);

	public ngOnInit() {
		const globalSub = this.registrationForm.valueChanges.subscribe((values) => {
			this.hasData = Object.values(values).some((val) => {
				// Handle nested objects and arrays
				if (typeof val === "object" && val !== null) {
					return Object.values(val).some((nestedVal) => {
						if (Array.isArray(nestedVal)) {
							return nestedVal.length > 0;
						} else if (typeof nestedVal === "object" && nestedVal !== null) {
							return Object.values(nestedVal).some(
								(deepNestedVal) => deepNestedVal && deepNestedVal.toString().trim() !== "",
							);
						} else {
							return nestedVal && nestedVal.toString().trim() !== "";
						}
					});
				}
				return val && val.toString().trim() !== "";
			});
		});
		this.subscriptions.push(globalSub);

		const birthSub = this.registrationForm.get("student.birthDate")?.valueChanges.subscribe((birthDate) => {
			if (birthDate) {
				const age = calculateAge(birthDate);
				this.registrationForm.patchValue({
					responsible: {
						isStudentResponsible: age >= 18,
					},
				});
			}
		});
		if (birthSub) {
			this.subscriptions.push(birthSub);
		}

		// Recherche de responsables possibles lors de la saisie du nom de l'élève
		// Si un responsable est sélectionné, on ne fait plus de recherche
		// Attente de 500ms après  la dernière saisie avant de lancer la recherche
		const studentNameSub = this.registrationForm.get("student.lastName")?.valueChanges.subscribe((value) => {
			if (this.possibleResponsibleSelected) {
				return;
			}
			if (this.fetchResponsibleTimeout) {
				clearTimeout(this.fetchResponsibleTimeout);
			}
			this.fetchResponsibleTimeout = setTimeout(() => {
				if (value && value.trim().length >= 2) {
					this.possibleResponsibleList = this.responsibleService
						.researchPossibleResponsible({
							lastName: value,
						})
						.map((r) => ({
							uid: r.uid,
							displayName: r.firstName + " " + r.lastName,
							email: r.email,
						}));
				} else {
					this.possibleResponsibleList = [];
				}
			}, 500);
		});
		if (studentNameSub) {
			this.subscriptions.push(studentNameSub);
		}

		// Recherche de responsables possibles lors de la saisie du prénom / nom / email du responsable
		// Si un responsable est sélectionné, on ne fait plus de recherche
		// Attente de 500ms après la dernière saisie avant de lancer la recherche
		const responsibleFirstNameSub = this.registrationForm.get("responsible.firstName")?.valueChanges.subscribe(() => {
			if (this.possibleResponsibleSelected) {
				return;
			}
			if (this.fetchResponsibleTimeout) {
				clearTimeout(this.fetchResponsibleTimeout);
			}
			this.setResponsibleTimeout();
		});
		if (responsibleFirstNameSub) {
			this.subscriptions.push(responsibleFirstNameSub);
		}

		const responsibleLastNameSub = this.registrationForm.get("responsible.lastName")?.valueChanges.subscribe(() => {
			if (this.possibleResponsibleSelected) {
				return;
			}
			if (this.fetchResponsibleTimeout) {
				clearTimeout(this.fetchResponsibleTimeout);
			}
			this.setResponsibleTimeout();
		});
		if (responsibleLastNameSub) {
			this.subscriptions.push(responsibleLastNameSub);
		}

		const responsibleEmailSub = this.registrationForm.get("responsible.email")?.valueChanges.subscribe(() => {
			if (this.possibleResponsibleSelected) {
				return;
			}
			if (this.fetchResponsibleTimeout) {
				clearTimeout(this.fetchResponsibleTimeout);
			}
			this.setResponsibleTimeout();
		});
		if (responsibleEmailSub) {
			this.subscriptions.push(responsibleEmailSub);
		}

		const isRespSub = this.registrationForm
			.get("responsible.isStudentResponsible")
			?.valueChanges.subscribe((isResponsible) => {
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
		if (isRespSub) {
			this.subscriptions.push(isRespSub);
		}

		// Observable sur le stream des responsbles au cas ou un nouveau serait ajouté pendant la saisie du formulaire
		const responsibleListSub = this.responsibleService.responsibleList$.subscribe(() => {
			if (this.possibleResponsibleSelected) {
				const selected = this.responsibleService.currentResponsibleList.find(
					(r) => r.uid === this.possibleResponsibleSelected?.uid,
				);
				if (!selected) {
					this.possibleResponsibleSelected = undefined;
					this.registrationForm.get("responsible")?.enable();
				}
			}

			this.setResponsibleTimeout();
		});
		this.subscriptions.push(responsibleListSub);

		this.addActivity();
		this.updateTotals();

		// Définition de l'année en cours pour cette inscription
		// Si après août, on est dans la nouvelle année scolaire donc on ajoute 1
		const currentYear = new Date().getFullYear();
		this.currentYearString = currentYear.toString();
		if (new Date().getMonth() >= 7) {
			this.currentYearString = this.currentYearString + "-" + (currentYear + 1);
		} else {
			this.currentYearString = currentYear - 1 + "-" + currentYear;
		}
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

	protected async onSubmit(): Promise<void> {
		if (this.registrationForm.invalid) {
			this.registrationForm.markAsTouched();
			return;
		}

		this.loading = true;
		const rawValues = this.registrationForm.getRawValue();

		let uidResponsible = "";
		if (this.possibleResponsibleSelected === undefined || this.possibleResponsibleSelected.uid === undefined) {
			// Aucun responsable sélectionné, on crée un nouveau responsable
			const responsible = responsibleFromFormRegistration(rawValues);
			const responsibleCollectionRef = collection(this.firestore, FirestoreCollectionsEnum.RESPONSIBLE);
			// Envoi / définition du responsable
			try {
				uidResponsible = (await addDoc(responsibleCollectionRef, responsible)).id;
			} catch (err) {
				console.error("Erreur lors de l'enregistrement du responsable :", err);
				this.messageService.add({
					severity: "error",
					summary: "Erreur",
					detail: "Une erreur est survenue lors de l'enregistrement du responsable. Veuillez réessayer.",
				});
				this.loading = false;
				return;
			}
		} else if (this.possibleResponsibleSelected.uid) {
			// Un responsable est sélectionné
			uidResponsible = this.possibleResponsibleSelected.uid;
		} else {
			console.error("Aucun responsable sélectionné et aucun nouveau responsable à créer.");
			this.messageService.add({
				severity: "error",
				summary: "Erreur",
				detail: "Une erreur est survenue lors de l'enregistrement du responsable. Veuillez réessayer.",
			});
			this.loading = false;
			return;
		}

		// Envoi de l'étudiant
		const student = studentFromFormRegistration(rawValues, uidResponsible);
		const studentCollectionRef = collection(
			this.firestore,
			FirestoreCollectionsEnum.STUDENT + "/" + this.currentYearString + "/records",
		);
		addDoc(studentCollectionRef, student)
			.then(() => {
				this.messageService.add({
					severity: "success",
					summary: "Inscription réussie",
					detail: `L'inscription de ${student.firstName} ${student.lastName} a été enregistrée avec succès.`,
				});
				this.goBack(true);
				this.loading = false;
			})
			.catch((err) => {
				console.error("Erreur lors de l'enregistrement de l'inscription :", err);
				this.messageService.add({
					severity: "error",
					summary: "Erreur",
					detail: "Une erreur est survenue lors de l'enregistrement de l'inscription. Veuillez réessayer.",
				});
				this.loading = false;
			});
	}

	protected goBack(force = false): void {
		if (this.hasData && !force) {
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

	protected onListResponsibleSelect(event: SelectChangeEvent) {
		const selectedUid = event.value;
		const selected = this.possibleResponsibleList.find((r) => r.uid === selectedUid);
		if (selected) {
			this.possibleResponsibleSelected = selected;
			const responsible = this.responsibleService.currentResponsibleList.find((r) => r.uid === selected.uid);
			if (responsible) {
				this.registrationForm.patchValue({
					responsible: {
						firstName: responsible.firstName,
						lastName: responsible.lastName,
						email: responsible.email,
						phone: responsible.phone,
						address: responsible.address,
						postalCode: responsible.postalCode,
						city: responsible.city,
					},
				});
				this.registrationForm.get("responsible")?.disable();
				return;
			}
		}
		this.registrationForm.get("responsible")?.enable();
	}

	public ngOnDestroy() {
		this.subscriptions.forEach((sub) => sub.unsubscribe());
		if (this.fetchResponsibleTimeout) {
			clearTimeout(this.fetchResponsibleTimeout);
		}
	}

	private setResponsibleTimeout() {
		this.fetchResponsibleTimeout = setTimeout(() => {
			const firstName = this.registrationForm.get("responsible.firstName")?.value;
			const lastName = this.registrationForm.get("responsible.lastName")?.value;
			const email = this.registrationForm.get("responsible.email")?.value;
			if (
				(email && email.trim().length >= 5) ||
				(firstName && firstName.trim().length >= 2) ||
				(lastName && lastName.trim().length >= 2)
			) {
				this.possibleResponsibleList = this.responsibleService
					.researchPossibleResponsible({
						email: email!,
						firstName: firstName!,
						lastName: lastName!,
					})
					.map((r) => ({
						uid: r.uid,
						displayName: r.firstName + " " + r.lastName,
						email: r.email,
					}));
			} else {
				this.possibleResponsibleList = [];
			}
		}, 500);
	}
}
