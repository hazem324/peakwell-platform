import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { BackLayoutRoutingModule } from './back-layout-routing.module';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { TopbarComponent } from './components/topbar/topbar.component';
import { AdminShellComponent } from './layout/admin-shell/admin-shell.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ClientsComponent } from './pages/clients/clients.component';
import { MealPlansAdminComponent } from './pages/meal-plans-admin/meal-plans-admin.component';
import { ScheduleComponent } from './pages/schedule/schedule.component';
import { ReportsComponent } from './pages/reports/reports.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { SportEventComponent } from './pages/sport-event/sport-event.component';
import { ListEventComponent } from './pages/sport-event/list-event/list-event.component';
import { AddEventComponent } from './pages/sport-event/add-event/add-event.component';
import { EditEventModalComponent } from './pages/sport-event/edit-event-modal/edit-event-modal.component';
import { EventRegistrationsComponent } from './pages/sport-event/event-registrations/event-registrations.component';
import { ListAvisComponent } from './pages/sport-event/list-avis/list-avis.component';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { MapPickerModalComponent } from './pages/sport-event/map-picker-modal/map-picker-modal.component';
import { AdminStatsPageComponent } from '../../features/user/pages/admin-stats-page/admin-stats-page.component';
import { UserModule } from '../../features/user/user.module';
import { ProductsComponent } from './pages/products/products.component';
import { BiometricFormComponent } from './pages/dossier-medical/components/biometric-form/biometric-form.component';
import { BiometricChartsComponent } from './pages/dossier-medical/components/biometric-charts/biometric-charts.component';
import { AlertsPanelComponent } from './pages/dossier-medical/components/alerts-panel/alerts-panel.component';
import { ConsultationNotesComponent } from './pages/dossier-medical/components/consultation-notes/consultation-notes.component';
import { ConsultationsAdminComponent } from './pages/consultations-admin/consultations-admin.component';
import { RiskDashboardComponent } from './pages/risk-dashboard/risk-dashboard.component';
import { HttpClientModule } from '@angular/common/http';
import { MedicalProfilesComponent } from './pages/medical-profiles/medical-profiles.component';

import { HealthHeatmapComponent } from './pages/health-heatmap/health-heatmap.component';



@NgModule({
  declarations: [
    AdminShellComponent,
    SidebarComponent,
    TopbarComponent,
    DashboardComponent,
    ClientsComponent,
    MealPlansAdminComponent,
    ScheduleComponent,
    ReportsComponent,
    SportEventComponent,
    ListEventComponent,
    AddEventComponent,
    EditEventModalComponent,
    EventRegistrationsComponent,
    ListAvisComponent,
    MapPickerModalComponent,
    SettingsComponent, 
    AdminStatsPageComponent,
    ProductsComponent,
    BiometricFormComponent,
    BiometricChartsComponent,
    AlertsPanelComponent,
    ConsultationNotesComponent,
    ConsultationsAdminComponent,
    AdminStatsPageComponent,
    MedicalProfilesComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    BackLayoutRoutingModule,
    FormsModule,
    LeafletModule,
    UserModule,
    HttpClientModule,

  ],

})
export class BackLayoutModule { }