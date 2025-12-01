import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from "@angular/core";
import { provideRouter } from "@angular/router";

import { routes } from "./app.routes";
import { FirebaseApp, initializeApp, provideFirebaseApp } from "@angular/fire/app";
import { environment } from "../environments/environment";
import { getAuth, provideAuth } from "@angular/fire/auth";
import { getFirestore, provideFirestore } from "@angular/fire/firestore";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import { providePrimeNG } from "primeng/config";
import { customPreset } from "./core/constants/themes.constant";
import { provideAnimations } from "@angular/platform-browser/animations";
import { getFunctions, provideFunctions } from "@angular/fire/functions";
import { ConfirmationService, MessageService } from "primeng/api";
import { DATE_PIPE_DEFAULT_OPTIONS } from "@angular/common";
import { fr } from "primelocale/js/fr.js";

let app: FirebaseApp | undefined;
const region = "europe-west9"; // Paris

export const appConfig: ApplicationConfig = {
	providers: [
		// Angular imports
		provideBrowserGlobalErrorListeners(),
		provideAnimations(),
		provideZoneChangeDetection({ eventCoalescing: true }),
		provideRouter(routes),
		{ provide: DATE_PIPE_DEFAULT_OPTIONS, useValue: { dateFormat: "short" } },

		// Firebase imports
		provideFirebaseApp(() => {
			if (!app) {
				app = initializeApp(environment.firebase);
			}
			return app;
		}),
		provideAuth(() => getAuth()),
		provideFirestore(() => getFirestore()),
		provideFunctions(() => getFunctions(app, region)),

		// PrimeNg imports
		provideAnimationsAsync(),
		providePrimeNG({
			translation: fr,
			ripple: false,
			theme: {
				preset: customPreset,
				options: {
					darkModeSelector: ".dark-mode",
				},
			},
		}),
		MessageService,
		ConfirmationService,
	],
};
