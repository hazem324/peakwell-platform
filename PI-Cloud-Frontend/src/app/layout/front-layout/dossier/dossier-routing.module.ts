import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DossierShellComponent } from './dossier-shell/dossier-shell.component';

const routes: Routes = [
  { path: '', component: DossierShellComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DossierRoutingModule {}