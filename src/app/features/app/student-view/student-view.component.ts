import { Component, inject, input, OnInit, signal } from "@angular/core";
import { Student, StudentNoUid } from "../../../core/models/student.model";
import { StudentService } from "../../../core/services/student.service";
import { Router } from "@angular/router";
import { PaymentMethod } from "../../../core/models/types/payment-method.type";
import { MeonOfPayment } from "../../../core/models/types/mean-of-payment.type";
import { ConfirmationService, MessageService } from "primeng/api";
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { Activity } from "../../../core/models/activity.models";
import { DividerModule } from "primeng/divider";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { SelectModule } from "primeng/select";
import { MultiSelectModule } from "primeng/multiselect";
import { TableModule } from "primeng/table";
import { CheckboxModule } from "primeng/checkbox";
import { DatePickerModule } from "primeng/datepicker";
import { TagModule } from "primeng/tag";
import { ToolbarModule } from "primeng/toolbar";
import { CardModule } from "primeng/card";
import { InputNumberModule } from "primeng/inputnumber";
import { TextareaModule } from "primeng/textarea";
import { DatePipe, Location } from "@angular/common";
import { FloatLabel } from "primeng/floatlabel";
import { ACTIVITIES_CATALOG } from "../../../core/constants/activities.constant";
import { Auth } from "@angular/fire/auth";
import { ActivityOption } from "../../../core/models/activity-option.model";
import { ResponsibleService } from "../../../core/services/responsible.service";

type ActivityFormGroup = FormGroup<{
  id: FormControl<string | null>;
  forfait: FormControl<string | null>;
  price: FormControl<number | null>;
  teacher: FormControl<string | null>;
}>;

@Component({
  selector: "app-student-view",
  imports: [
    DividerModule,
    InputTextModule,
    ReactiveFormsModule,
    SelectModule,
    MultiSelectModule,
    TableModule,
    CheckboxModule,
    ButtonModule,
    DatePickerModule,
    TagModule,
    ToolbarModule,
    CardModule,
    InputNumberModule,
    TextareaModule,
    DatePipe,
    FloatLabel,
  ],
  templateUrl: "./student-view.component.html",
  styleUrl: "./student-view.component.scss",
})
export class StudentViewComponent implements OnInit {
  private fb = inject(FormBuilder);
  private studentService = inject(StudentService);
  private responsibleService = inject(ResponsibleService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  protected router = inject(Router);
  protected location = inject(Location);
  private auth = inject(Auth);

  public student = input.required<Student>();

  protected catalog = ACTIVITIES_CATALOG;

  protected studentForm!: FormGroup<{
    uid: FormControl<string | null>;
    lastName: FormControl<string | null>;
    firstName: FormControl<string | null>;
    birthDate: FormControl<Date | null>;
    isStudentResponsible: FormControl<boolean | null>;
    responsible: FormControl<string | null>;
    consents: FormGroup<{
      insuranceRC: FormControl<boolean | null>;
      internalRules: FormControl<boolean | null>;
      imageRight: FormControl<boolean | null>;
      helpEvent: FormControl<boolean | null>;
    }>;
    activities: FormArray<ActivityFormGroup>;
    paymentMethod: FormControl<PaymentMethod | null>;
    meanOfPayment: FormControl<MeonOfPayment[] | null>;
    comments: FormControl<string | null>;
    createdAt: FormControl<Date | null>;
    updatedAt: FormControl<Date | null>;
    createdBy: FormControl<string | null>;
    updatedBy: FormControl<string | null>;
  }>;

  // listes pour dropdowns
  paymentMethodOptions = [
    { label: "Paiement unique (1x)", value: "1x" as PaymentMethod },
    { label: "En 3 fois (3x)", value: "3x" as PaymentMethod },
    { label: "En 10 fois (10x)", value: "10x" as PaymentMethod },
  ];
  meanOfPaymentOptions = [
    { label: "Virement", value: "virement" as MeonOfPayment },
    { label: "Chèque", value: "cheque" as MeonOfPayment },
    { label: "ANCV", value: "ancv" as MeonOfPayment },
    { label: "Chéquier Jeune", value: "chequier_jeune" as MeonOfPayment },
  ];

  // état UI
  loading = signal<boolean>(true);
  editMode = signal<boolean>(false);
  today = new Date();

  public ngOnInit() {
    this.buildForm();
    this.loadStudent();
  }

  private buildForm(): void {
    this.studentForm = this.fb.nonNullable.group({
      uid: this.fb.control<string | null>(null),
      lastName: this.fb.control<string | null>(null, {
        validators: [Validators.required, Validators.maxLength(70)],
      }),
      firstName: this.fb.control<string | null>(null, {
        validators: [Validators.required, Validators.maxLength(70)],
      }),
      birthDate: this.fb.control<Date | null>(null, { validators: [Validators.required] }),
      isStudentResponsible: this.fb.control<boolean | null>(false),
      responsible: this.fb.control<string | null>("", { validators: [] }),
      consents: this.fb.group({
        insuranceRC: this.fb.control<boolean | null>(false),
        internalRules: this.fb.control<boolean | null>(false),
        imageRight: this.fb.control<boolean | null>(false),
        helpEvent: this.fb.control<boolean | null>(false),
      }),
      activities: this.fb.array<ActivityFormGroup>([]),
      paymentMethod: this.fb.control<PaymentMethod | null>(null),
      meanOfPayment: this.fb.control<MeonOfPayment[] | null>([]),
      comments: this.fb.control<string | null>(""),
      createdAt: this.fb.control<Date | null>(null),
      updatedAt: this.fb.control<Date | null>(null),
      createdBy: this.fb.control<string | null>(null),
      updatedBy: this.fb.control<string | null>(null),
    });

    this.updateFormEnabledState();
  }

  private loadStudent(): void {
    try {
      this.loading.set(true);
      const s = this.student();

      // Récupère le profil du responsable lié
      if (s.responsible) {
        const r = this.responsibleService.getById(s.responsible);
        if (r) {
          this.studentForm.controls.responsible.setValue(r.lastName + " " + r.firstName);
        } else {
          this.studentForm.controls.responsible.setValue("Responsable inconnu");
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const toDate = (d: any): Date =>
        d?.toDate ? d.toDate() : d instanceof Date ? d : new Date(d);

      this.studentForm.reset();
      this.studentForm.patchValue({
        uid: s.uid ?? null,
        lastName: s.lastName ?? null,
        firstName: s.firstName ?? null,
        birthDate: s.birthDate ? toDate(s.birthDate) : null,
        isStudentResponsible: s.isStudentResponsible,
        paymentMethod: s.paymentMethod ?? null,
        meanOfPayment: s.meanOfPayment ?? [],
        consents: {
          insuranceRC: s.consents?.insuranceRC ?? false,
          internalRules: s.consents?.internalRules ?? false,
          imageRight: s.consents?.imageRight ?? false,
          helpEvent: s.consents?.helpEvent ?? false,
        },
        comments: s.comments ?? "",
        createdAt: s.createdAt ? toDate(s.createdAt) : null,
        updatedAt: s.updatedAt ? toDate(s.updatedAt) : null,
        createdBy: s.createdBy ?? null,
        updatedBy: s.updatedBy ?? null,
      });

      // activités
      this.activities.clear();
      (s.activities ?? []).forEach((a) => this.activities.push(this.newActivityGroup(a)));

      // si l'élève est son propre responsable, on nettoie le champ responsible
      this.studentForm.controls.isStudentResponsible.valueChanges.subscribe((v) => {
        if (v) this.studentForm.controls.responsible.setValue("");
      });

      this.loading.set(false);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      this.loading.set(false);
      this.messageService.add({
        severity: "error",
        summary: "Erreur",
        detail: "Impossible de charger la fiche élève.",
      });
      this.router.navigate(["../"]);
    }
  }

  protected get activities(): FormArray<ActivityFormGroup> {
    return this.studentForm.controls.activities;
  }

  private newActivityGroup(a?: Partial<Activity>): ActivityFormGroup {
    const group = this.fb.group({
      id: this.fb.control<string | null>(a?.id ?? null, { validators: [Validators.required] }),
      forfait: this.fb.control<string | null>(a?.forfait ?? "", {
        validators: [Validators.required, Validators.maxLength(120)],
      }),
      price: this.fb.control<number | null>(a?.price ?? 0, {
        validators: [Validators.required, Validators.min(0)],
      }),
      teacher: this.fb.control<string | null>(a?.teacher ?? "", {
        validators: [Validators.required, Validators.maxLength(80)],
      }),
    });

    if (!this.editMode()) {
      group.disable();
    }

    return group;
  }

  protected addActivity(): void {
    this.activities.push(this.newActivityGroup());
    this.updateFormEnabledState();
  }

  protected removeActivity(index: number): void {
    this.activities.removeAt(index);
  }

  protected toggleEdit(): void {
    this.editMode.update((v) => !v);
    this.updateFormEnabledState();
  }

  protected cancelEdit(): void {
    // recharge la fiche depuis le service
    this.editMode.set(false);
    this.updateFormEnabledState();
    this.loadStudent();
  }

  private updateFormEnabledState(): void {
    if (!this.studentForm) return;
    if (this.editMode()) {
      this.studentForm.enable();
      // champs audit restent en lecture seule
      this.studentForm.controls.createdAt.disable();
      this.studentForm.controls.updatedAt.disable();
      this.studentForm.controls.createdBy.disable();
      this.studentForm.controls.updatedBy.disable();
      this.studentForm.controls.uid.disable();
      this.studentForm.controls.responsible.disable();
    } else {
      this.studentForm.disable();
      this.activities.controls.forEach((ctrl) => ctrl.disable());
    }
  }

  protected onForfaitChange(activity: FormGroup) {
    const activityId = activity.get("id")?.value as string;
    const forfait = activity.get("forfait")?.value as string;
    const opt = this.catalog
      .find((c) => c.id === activityId)
      ?.options.find((o: { label: string }) => o.label === forfait);
    activity.get("price")?.setValue(opt?.price ?? 0, { emitEvent: false });
  }

  protected async save(): Promise<void> {
    if (this.studentForm.invalid) {
      this.studentForm.markAllAsTouched();
      this.messageService.add({
        severity: "warn",
        summary: "Validation",
        detail: "Veuillez corriger les erreurs du studentFormulaire.",
      });
      return;
    }

    const raw = this.studentForm.getRawValue(); // inclut les champs disabled
    const payload: StudentNoUid = {
      lastName: raw.lastName!,
      firstName: raw.firstName!,
      birthDate: raw.birthDate!,
      isStudentResponsible: !!raw.isStudentResponsible,
      responsible: raw.isStudentResponsible ? "" : (raw.responsible ?? ""),
      consents: {
        insuranceRC: !!raw.consents.insuranceRC,
        internalRules: !!raw.consents.internalRules,
        imageRight: !!raw.consents.imageRight,
        helpEvent: !!raw.consents.helpEvent,
      },
      activities: (raw.activities ?? []).map((a) => ({
        id: a.id!,
        forfait: a.forfait!,
        price: Number(a.price ?? 0),
        teacher: a.teacher!,
      })),
      paymentMethod: raw.paymentMethod ?? undefined,
      meanOfPayment: raw.meanOfPayment ?? undefined,
      comments: raw.comments ?? "",
      updatedAt: new Date(),
      updatedBy: this.auth.currentUser?.displayName ?? this.auth.currentUser?.email ?? "Inconnu",
    };

    try {
      await this.studentService.update(this.student().uid!, payload);
      this.messageService.add({
        severity: "success",
        summary: "Enregistré",
        detail: "La fiche élève a été sauvegardée.",
      });
      this.editMode.set(false);
      this.updateFormEnabledState();
      // rafraîchit les métadonnées locales
      this.studentForm.patchValue({ updatedAt: payload.updatedAt, updatedBy: payload.updatedBy });
      this.updateFormEnabledState();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      this.messageService.add({
        severity: "error",
        summary: "Erreur",
        detail: "Sauvegarde échouée.",
      });
    }
  }

  protected navigateToResponsible(): void {
    const id = this.studentForm.controls.responsible.value;
    if (id) this.router.navigate(["/responsibles", id]);
  }

  // helpers UI
  protected hasError(path: keyof Student | string): boolean {
    const ctrl = this.studentForm.get(path);
    return !!ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  protected forfaitsForActivity(id: string): ActivityOption[] | null {
    const found = this.catalog.find((c) => c.id === id);
    return found ? found.options : null;
  }

  protected deleteDialog() {
    this.confirmationService.confirm({
      header: "Confirmation",
      message:
        "Confirmez-vous la suppression de cette fiche élève ? Cette action est irréversible.<br>Les calculs de coût pour l'adhérent actif seront mis à jour.",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Oui",
      rejectLabel: "Non",
      rejectButtonStyleClass: "p-button-secondary",
      accept: async () => {
        try {
          await this.studentService.delete(this.student().uid!);
          this.messageService.add({
            severity: "success",
            summary: "Supprimé",
            detail: "La fiche élève a été supprimée.",
          });
          this.router.navigate(["../"]);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
          this.messageService.add({
            severity: "error",
            summary: "Erreur",
            detail: "Suppression échouée.",
          });
        }
      },
    });
  }
}
