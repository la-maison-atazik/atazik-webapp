import { Routes } from "@angular/router";
import { SignInComponent } from "./features/sign-in/sign-in.component";
import { AuthGuard, redirectUnauthorizedTo } from "@angular/fire/auth-guard";
import { UserManagementComponent } from "./features/app/user-management/user-management.component";
import { SignUpComponent } from "./features/sign-up/sign-up.component";
import { roleGuard } from "./core/guards/role.guard";
import { UserRoleEnum } from "@shared/enums/user-roles.enum";
import { statusGuard } from "./core/guards/status.guard";
import { UserStatusEnum } from "@shared/enums/user-status.enum";
import { StudentViewComponent } from "./features/app/student-view/student-view.component";
import { ActiveMemberTableComponent } from "./features/app/active-member-table/active-member-table.component";
import { NewRegistrationComponent } from "./features/app/new-registration/new-registration.component";
import { StudentTableComponent } from "./features/app/student-table/student-table.component";
import { studentResolver } from "./shared/resolvers/student-resolver";

const redirectUnauthorizedToSignIn = () => redirectUnauthorizedTo(["/sign-in"]);

export const routes: Routes = [
  {
    path: "app",
    canActivate: [AuthGuard, statusGuard],
    data: { authGuardPipe: redirectUnauthorizedToSignIn, status: UserStatusEnum.ACTIVATED },
    children: [
      {
        path: "",
        pathMatch: "full",
        redirectTo: "active-member-table", // TODO change to 'home' when HomeComponent is ready
      },
      {
        path: "home",
        // component: HomeComponent,
        title: "Atazik - Accueil",
        redirectTo: "/app/active-member-table",
      },
      {
        path: "active-member-table",
        component: ActiveMemberTableComponent,
        title: "Atazik - Adhérents actifs",
      },
      {
        path: "student-table",
        component: StudentTableComponent,
        title: "Atazik - Élèves",
      },
      {
        path: "new-registration",
        component: NewRegistrationComponent,
        title: "Atazik - Nouvelle inscription",
      },
      {
        path: "student-view/:uid",
        component: StudentViewComponent,
        resolve: {
          student: studentResolver,
        },
        title: "Atazik - Fiche élève",
      },
      {
        path: "user-management",
        component: UserManagementComponent,
        canActivate: [roleGuard],
        data: { role: UserRoleEnum.PRESIDENT },
        title: "Atazik - Gestion des utilisateurs",
      },
    ],
  },
  { path: "sign-in", component: SignInComponent, title: "Atazik - Connexion" },
  {
    path: "sign-up",
    component: SignUpComponent,
    title: "Atazik - Inscription",
  },
  { path: "", redirectTo: "/app/home", pathMatch: "full" },
  { path: "**", redirectTo: "/app/home" },
];
