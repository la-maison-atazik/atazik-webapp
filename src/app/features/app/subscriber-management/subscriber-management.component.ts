import { Component, inject } from "@angular/core";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { ToastModule } from "primeng/toast";
import { CardModule } from "primeng/card";
import { TabsModule } from "primeng/tabs";
import { SubscriberTableComponent } from "../../../shared/components/subscriber-table/subscriber-table.component";
import { ResponsibleTableComponent } from "../../../shared/components/responsible-table/responsible-table.component";
import { ToolbarModule } from "primeng/toolbar";
import { ButtonModule } from "primeng/button";
import { IconField } from "primeng/iconfield";
import { InputIcon } from "primeng/inputicon";
import { InputText } from "primeng/inputtext";
import { Ripple } from "primeng/ripple";
import { ConfirmationService, MessageService } from "primeng/api";
import { Router } from "@angular/router";

@Component({
	selector: "app-subscriber-management",
	imports: [
		ConfirmDialogModule,
		ToastModule,
		CardModule,
		TabsModule,
		SubscriberTableComponent,
		ResponsibleTableComponent,
		ToolbarModule,
		ButtonModule,
		IconField,
		InputIcon,
		InputText,
		Ripple,
	],
	providers: [ConfirmationService, MessageService],
	templateUrl: "./subscriber-management.component.html",
	styleUrl: "./subscriber-management.component.scss",
})
export class SubscriberManagementComponent {
	private confirmationService = inject(ConfirmationService);
	private messageService = inject(MessageService);
	private router = inject(Router);

	protected confirmDialogVisible = false;

	protected showConfirmDialog(): void {
		this.confirmDialogVisible = true;
	}

	protected onConfirm(): void {
		this.confirmationService.confirm({
			message: "Are you sure you want to proceed?",
			accept: () => {
				this.messageService.add({
					severity: "success",
					summary: "Confirmed",
					detail: "You have confirmed the action.",
				});
				this.confirmDialogVisible = false;
			},
			reject: () => {
				this.messageService.add({ severity: "info", summary: "Cancelled", detail: "You have cancelled the action." });
				this.confirmDialogVisible = false;
			},
		});
	}

	goToNewRegistration() {
		this.router.navigate(["/app/new-registration"]);
	}
}
