import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms'; 

import { UserRoutingModule } from './user-routing.module';
import { StudentProfileFormComponent } from './components/student-profile-form/student-profile-form.component';
import { DietitianProfileFormComponent } from './components/dietitian-profile-form/dietitian-profile-form.component';
import { CompleteProfileComponent } from './pages/complete-profile/complete-profile.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { UsersToolbarComponent } from './components/users-toolbar/users-toolbar.component';
import { UsersTableComponent } from './components/users-table/users-table.component';
import { UserDetailModalComponent } from './components/modals/user-detail-modal/user-detail-modal.component';
import { UserStatusModalComponent } from './components/modals/user-status-modal/user-status-modal.component';
import { AdminUsersPageComponent } from './pages/admin-users-page/admin-users-page.component';
import { StatsKpiCardsComponent } from './components/stats-kpi-cards/stats-kpi-cards.component';
import { StatsRolesChartComponent } from './components/stats-roles-chart/stats-roles-chart.component';
import { StatsGrowthChartComponent } from './components/stats-growth-chart/stats-growth-chart.component';
import { StatsFailedAttemptsComponent } from './components/stats-failed-attempts/stats-failed-attempts.component';
import { StatsRiskTableComponent } from './components/stats-risk-table/stats-risk-table.component';
import { ChangePasswordModalComponent } from './components/change-password-modal/change-password-modal.component';
import { ActivityTopIpsComponent } from './components/activity-top-ips/activity-top-ips.component';
import { ActivitySummaryCardsComponent } from './components/activity-summary-cards/activity-summary-cards.component';
import { ActivityMostActiveComponent } from './components/activity-most-active/activity-most-active.component';
import { ActivityFeedComponent } from './components/activity-feed/activity-feed.component';
import { ActivityByTypeComponent } from './components/activity-by-type/activity-by-type.component';


@NgModule({
  declarations: [
    StudentProfileFormComponent,
    DietitianProfileFormComponent,
    CompleteProfileComponent,
    UserProfileComponent,
    ProfileComponent,
    UsersToolbarComponent,
    UsersTableComponent,
    UserDetailModalComponent,
    UserStatusModalComponent,
    AdminUsersPageComponent,
    StatsKpiCardsComponent,
    StatsRolesChartComponent,
    StatsGrowthChartComponent,
    StatsFailedAttemptsComponent,
    StatsRiskTableComponent,
    ChangePasswordModalComponent,
    ActivityTopIpsComponent,
    ActivitySummaryCardsComponent,
    ActivityMostActiveComponent,
    ActivityFeedComponent,
    ActivityByTypeComponent,
  ],
  exports: [
    StatsKpiCardsComponent,
    StatsRolesChartComponent,
    StatsGrowthChartComponent,
    StatsFailedAttemptsComponent,
    StatsRiskTableComponent,
    ActivitySummaryCardsComponent,
    ActivityFeedComponent,
    ActivityByTypeComponent,
    ActivityTopIpsComponent,
    ActivityMostActiveComponent,
  ],
  imports: [
    CommonModule,
    UserRoutingModule,
    ReactiveFormsModule,
    FormsModule,
  ]
})
export class UserModule { }
