import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EtudiantRoutingModule } from './etudiant-routing.module';
import { MealsEtudiantComponent } from './components/meals-etudiant/meals-etudiant.component';
import { PlanEtudiantComponent } from './components/plan-etudiant/plan-etudiant.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { FrontLayoutModule } from "../../layout/front-layout/front-layout.module";
import { MenuListComponent } from './components/menu-list/menu-list.component';

import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    MealsEtudiantComponent,
    PlanEtudiantComponent,
    DashboardComponent,
    MenuListComponent
  ],
  imports: [
    CommonModule,
    EtudiantRoutingModule,
    FrontLayoutModule,
    FormsModule 
]
})
export class EtudiantModule { }
