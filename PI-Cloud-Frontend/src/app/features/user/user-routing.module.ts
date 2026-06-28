import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CompleteProfileComponent } from './pages/complete-profile/complete-profile.component';
import { ProfileComponent } from './pages/profile/profile.component';

const routes: Routes = [
  {path: 'complete-profile', component: CompleteProfileComponent }, 
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule { }
