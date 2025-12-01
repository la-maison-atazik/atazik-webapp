import { Component, computed, inject } from "@angular/core";
import { Auth, AuthModule } from "@angular/fire/auth";
import { Router, RouterModule } from "@angular/router";
import { ConfirmationService, MessageService } from "primeng/api";
import { ToastModule } from "primeng/toast";
import { ButtonModule } from "primeng/button";
import { isUserRoleEqualOrHigher } from "@shared/utils/user-role.utils";
import { UserRoleEnum } from "@shared/enums/user-roles.enum";
import { ClaimService } from "../../../core/services/claim.service";

@Component({
  selector: "app-header",
  imports: [AuthModule, RouterModule, ToastModule, ButtonModule],
  templateUrl: "./header.component.html",
  styleUrl: "./header.component.scss",
})
export class HeaderComponent {
  private roleService = inject(ClaimService);
  protected auth = inject(Auth);
  private router = inject(Router);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private role = this.roleService.role;
  protected isPresidentOrHigher = computed(() => {
    return isUserRoleEqualOrHigher(UserRoleEnum.PRESIDENT, this.role());
  });

  protected isSignUpUrl = this.router.url.includes("finish-signup");
  protected isRegistrationUrl = this.router.url.includes("new-registration");

  confirmSignOut() {
    this.confirmationService.confirm({
      message: "Êtes-vous sûr de vouloir vous déconnecter ?",
      header: "Confirmation",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Me déconnecter",
      rejectLabel: "Annuler",
      rejectButtonStyleClass: "p-button-secondary",
      accept: () => {
        this.auth.signOut().then(async () => {
          this.messageService.add({
            severity: "info",
            summary: "Déconnecté",
            detail: "Vous êtes déconnecté",
          });
          await this.router.navigate(["/sign-in"]);
        });
      },
    });
  }
}
