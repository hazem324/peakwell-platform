import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { DossierMedicalRoutingModule } from './dossier-medical-routing.module';
import { DossierShellComponent } from './dossier-shell/dossier-shell.component';
import { BiometricFormComponent } from './components/biometric-form/biometric-form.component';
import { HealthDashboardComponent } from './components/health-dashboard/health-dashboard.component';
import { BiometricChartsComponent } from './components/biometric-charts/biometric-charts.component';
import { AlertsPanelComponent } from './components/alerts-panel/alerts-panel.component';
import { ConsultationNotesComponent } from './components/consultation-notes/consultation-notes.component';


@NgModule({
  declarations: [
    DossierShellComponent,
    BiometricFormComponent,
    HealthDashboardComponent,
    BiometricChartsComponent,
    AlertsPanelComponent,
    ConsultationNotesComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    DossierMedicalRoutingModule
  ]
})
export class DossierMedicalModule { }
