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
import { StudentTableComponent } from "../../../shared/components/student-table/student-table.component";

@Component({
  selector: "app-dashboard",
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
    StudentTableComponent,
  ],
  templateUrl: "./dashboard.component.html",
  styleUrl: "./dashboard.component.scss",
})
export class DashboardComponent {
  private router = inject(Router);

  goToNewRegistration() {
    this.router.navigate(["/app/new-registration"]);
  }
}
