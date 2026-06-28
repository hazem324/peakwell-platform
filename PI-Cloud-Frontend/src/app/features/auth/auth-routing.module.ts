import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { SignupComponent } from './pages/signup/signup.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { AuthCallbackComponent } from './pages/callback/auth-callback/auth-callback.component';
const routes: Routes = [
  {path:"login", component: LoginComponent},
  {path:"signup", component: SignupComponent},
  { path: 'callback', component: AuthCallbackComponent },
  {path:"forget-password", component: ForgotPasswordComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }
