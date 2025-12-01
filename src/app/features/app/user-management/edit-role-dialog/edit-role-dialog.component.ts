import { Component, EventEmitter, inject, Input, Output } from "@angular/core";
import { Dialog } from "primeng/dialog";
import { FirebaseUserRow } from "../../../../core/models/tables-row/firebase-user-row.model";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ClaimService } from "../../../../core/services/claim.service";
import { SelectModule } from "primeng/select";
import { ButtonModule } from "primeng/button";
import { listBelowUserRoles, listUserRolesWithLabel } from "@shared/utils/user-role.utils";
import { UserRoleEnum } from "@shared/enums/user-roles.enum";
import { MessageModule } from "primeng/message";

@Component({
  selector: "app-edit-role-dialog",
  imports: [Dialog, ReactiveFormsModule, SelectModule, ButtonModule, MessageModule],
  templateUrl: "./edit-role-dialog.component.html",
  styleUrl: "./edit-role-dialog.component.scss",
})
export class EditRoleDialogComponent {
  private formBuilder = inject(FormBuilder);
  private claimService = inject(ClaimService);
  protected role = this.claimService.role;

  @Input({ required: true }) visible = false;
  @Input({ required: true }) user!: FirebaseUserRow;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() confirm = new EventEmitter<void>();

  protected loading = false;
  protected error = "";

  protected readonly formEditRole = this.formBuilder.group({
    role: ["", { validators: [Validators.required] }],
  });

  protected roles: { label: string; value: string; disabled: boolean }[] = [];

  protected onShow() {
    this.roles = listUserRolesWithLabel(
      this.role() === UserRoleEnum.ADMIN ? undefined : listBelowUserRoles(this.role()),
    ).map((role) => ({
      label: this.user.role === role.value ? role.label + " (actuel)" : role.label,
      value: role.value,
      disabled: this.user.role === role.value,
    }));
  }

  protected onSubmit() {
    if (this.formEditRole.invalid) {
      this.formEditRole.markAllAsTouched();
      return;
    }

    this.error = "";
    const role = this.formEditRole.get("role")?.value as UserRoleEnum;
    try {
      this.loading = true;
      this.claimService
        .editUserRole(this.user.uid!, role)
        .then(() => {
          this.confirm.emit();
          this.onClose();
        })
        .catch((error) => {
          console.error("Error editing user role:", error);
          this.error = "Une erreur est survenue. Veuillez réessayer.";
        })
        .finally(() => {
          this.loading = false;
        });
    } catch (error) {
      console.error("Error editing user role:", error);
      this.error = "Une erreur est survenue. Veuillez réessayer.";
      this.loading = false;
    }
  }

  onClose() {
    this.formEditRole.reset();
    this.error = "";
    this.loading = false;
    this.visibleChange.emit(false);
  }
}
