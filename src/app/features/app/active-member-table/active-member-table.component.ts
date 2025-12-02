import { Component, inject } from "@angular/core";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { ToastModule } from "primeng/toast";
import { CardModule } from "primeng/card";
import { TabsModule } from "primeng/tabs";
import { ToolbarModule } from "primeng/toolbar";
import { ButtonModule } from "primeng/button";
import { IconField } from "primeng/iconfield";
import { InputIcon } from "primeng/inputicon";
import { InputText } from "primeng/inputtext";
import { Ripple } from "primeng/ripple";
import { Router } from "@angular/router";

@Component({
  selector: "app-active-member-table",
  imports: [
    ConfirmDialogModule,
    ToastModule,
    CardModule,
    TabsModule,
    ToolbarModule,
    ButtonModule,
    IconField,
    InputIcon,
    InputText,
    Ripple,
  ],
  templateUrl: "./active-member-table.component.html",
  styleUrl: "./active-member-table.component.scss",
})
export class ActiveMemberTableComponent {
  private router = inject(Router);

  goToNewRegistration() {
    this.router.navigate(["/app/new-registration"]);
  }
}
