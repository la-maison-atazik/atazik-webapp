import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { HeaderComponent } from "./shared/components/header/header.component";
import { ConfirmDialog } from "primeng/confirmdialog";
import { Toast } from "primeng/toast";
import { FooterComponent } from "./shared/components/footer/footer.component";

@Component({
  selector: "app-root",
  imports: [RouterOutlet, HeaderComponent, ConfirmDialog, Toast, FooterComponent],
  templateUrl: "./app.html",
  styleUrl: "./app.scss",
})
export class App {}
