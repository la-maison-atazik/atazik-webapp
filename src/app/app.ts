import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { AppHeaderComponent } from "./shared/components/app-header/app-header.component";
import { ConfirmDialog } from "primeng/confirmdialog";
import { Toast } from "primeng/toast";

@Component({
	selector: "app-root",
	imports: [RouterOutlet, AppHeaderComponent, ConfirmDialog, Toast],
	templateUrl: "./app.html",
	styleUrl: "./app.scss",
})
export class App {}
