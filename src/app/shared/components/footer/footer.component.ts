import { Component } from "@angular/core";
import { Message } from "primeng/message";
import { environment } from "../../../../environments/environment";

@Component({
	selector: "app-footer",
	imports: [Message],
	templateUrl: "./footer.component.html",
	styleUrl: "./footer.component.scss",
})
export class FooterComponent {
	protected currentYear = new Date().getFullYear();
	protected isTestEnvironment = !environment.production;
}
