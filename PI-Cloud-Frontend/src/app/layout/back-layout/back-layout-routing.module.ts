import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminShellComponent } from './layout/admin-shell/admin-shell.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { MealPlansAdminComponent } from './pages/meal-plans-admin/meal-plans-admin.component';
import { ScheduleComponent } from './pages/schedule/schedule.component';
import { ReportsComponent } from './pages/reports/reports.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { SportEventComponent } from './pages/sport-event/sport-event.component';
import { AddEventComponent } from './pages/sport-event/add-event/add-event.component';
import { AdminStatsPageComponent } from '../../features/user/pages/admin-stats-page/admin-stats-page.component';
import { ProductsComponent } from './pages/products/products.component';
import { EventRegistrationsComponent } from './pages/sport-event/event-registrations/event-registrations.component';
import { ListAvisComponent } from './pages/sport-event/list-avis/list-avis.component';
import { ConsultationsAdminComponent } from './pages/consultations-admin/consultations-admin.component';
import { RiskDashboardComponent } from './pages/risk-dashboard/risk-dashboard.component';
import { HealthHeatmapComponent } from './pages/health-heatmap/health-heatmap.component';
import { AdminUsersPageComponent } from '../../features/user/pages/admin-users-page/admin-users-page.component';
import { MedicalProfilesComponent } from './pages/medical-profiles/medical-profiles.component';
import { AdminGuard } from '../../guards/admin.guard';


const routes: Routes = [
  {
    path: '',
    component: AdminShellComponent,
    canActivate: [AdminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'clients',     redirectTo: 'consultations', pathMatch: 'full' },
      { path: 'meal-plans', component: MealPlansAdminComponent },
      { path: 'schedule', component: ScheduleComponent },
      { path: 'reports', component: ReportsComponent },
      { path: 'settings', component: SettingsComponent },
      { path: 'events', component: SportEventComponent },
      { path: 'events/add', component: AddEventComponent },
      { path: 'events/:id/participants', component: EventRegistrationsComponent },
      { path: 'events/:id/reviews', component: ListAvisComponent },
      { path: 'users', component:AdminUsersPageComponent }, 
      { path: 'users/stats', component: AdminStatsPageComponent},
      { path: 'produits', component: ProductsComponent},
      { path: 'consultations', component: ConsultationsAdminComponent },
      { path: 'medical-profiles', component: MedicalProfilesComponent }

    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BackLayoutRoutingModule { }