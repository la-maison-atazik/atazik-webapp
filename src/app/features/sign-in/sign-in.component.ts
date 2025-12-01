import { Component, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { Password } from "primeng/password";
import { ButtonModule } from "primeng/button";
import { InputText } from "primeng/inputtext";
import { Message } from "primeng/message";
import { FloatLabel } from "primeng/floatlabel";
import { FirebaseErrorsEnum } from "../../core/enums/firebase/firebase-errors.enum";
import { PASSWORD } from "../../core/constants/regex.constant";
import { Auth, AuthModule, signInWithEmailAndPassword } from "@angular/fire/auth";
import { Router } from "@angular/router";
import { Card } from "primeng/card";
import { IconField } from "primeng/iconfield";
import { InputIcon } from "primeng/inputicon";
import { Ripple } from "primeng/ripple";
import { Divider } from "primeng/divider";

@Component({
  selector: "app-sign-in",
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Password,
    ButtonModule,
    InputText,
    Message,
    FloatLabel,
    AuthModule,
    Card,
    IconField,
    InputIcon,
    Ripple,
    Divider,
  ],
  templateUrl: "./sign-in.component.html",
  styleUrl: "./sign-in.component.scss",
})
export class SignInComponent {
  private readonly fb: FormBuilder = inject(FormBuilder);
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  protected isLoading = false;

  error = "";
  signInForm = this.fb.group({
    username: ["", [Validators.required, Validators.email]],
    password: ["", [Validators.required, Validators.pattern(PASSWORD)]],
  });

  async signIn() {
    this.isLoading = true;
    this.error = "";
    const { username, password } = this.signInForm.value;
    try {
      await signInWithEmailAndPassword(this.auth, username!.trim().toLowerCase(), password!);
      this.isLoading = false;
      await this.router.navigate(["/"]);
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      if (err.code === FirebaseErrorsEnum.INVALID_SIGN_IN_CREDENTIALS) {
        this.error =
          "Identifiants invalides. Veuillez vérifier votre adresse e-mail et votre mot de passe.";
      } else {
        this.error = "Une erreur est survenue. Veuillez réessayer plus tard.";
        console.log(err);
      }
      this.isLoading = false;
    }
  }
}
