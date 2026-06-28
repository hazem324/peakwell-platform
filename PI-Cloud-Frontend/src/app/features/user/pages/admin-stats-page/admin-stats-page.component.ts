import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';

import { AppToastService } from '../../../../services/app-toast.service';
import { UserStatsService } from '../../../../services/user-statsces.service';
import {
  UserActivityService,
  ActivityDashboard
} from '../../../../services/user-activity.service';

export interface GlobalStats {
  totalUsers:            number;
  activeUsers:           number;
  lockedUsers:           number;
  profileCompletionRate: number;
}

export interface RoleStat {
  role:  string;
  count: number;
}

export interface GrowthStat {
  date:  string;
  count: number;
}

export interface RiskUser {
  email:               string;
  totalFailedAttempts: number;
}

export interface FailedAttemptsStat {
  zeroToOne:    number;
  twoToFour:    number;
  moreThanFour: number;
}

const EMPTY_DASHBOARD: ActivityDashboard = {
  summary:              { total: 0, success: 0, failed: 0, successRate: 0 },
  byType:               [],
  recentActivity:       [],
  activityPerDay:       [],
  failedPerDay:         [],
  topIps:               [],
  topUserAgents:        [],
  byHour:               [],
  actionStatusBreakdown:[],
  mostActiveUsers:      []
};

@Component({
  selector: 'app-admin-stats-page',
  templateUrl: './admin-stats-page.component.html',
  styleUrl: './admin-stats-page.component.scss'
})
export class AdminStatsPageComponent implements OnInit {

  loading = true;
  error   = false;

  // ── Existing stats ───────────────────────────────────────────────────────
  global: GlobalStats = {
    totalUsers: 0, activeUsers: 0,
    lockedUsers: 0, profileCompletionRate: 0
  };
  roles:          RoleStat[]         = [];
  growth:         GrowthStat[]       = [];
  riskUsers:      RiskUser[]         = [];
  failedAttempts: FailedAttemptsStat = { zeroToOne: 0, twoToFour: 0, moreThanFour: 0 };

  // ── Activity dashboard ───────────────────────────────────────────────────
  activityDashboard: ActivityDashboard = EMPTY_DASHBOARD;

  constructor(
    private statsService:    UserStatsService,
    private activityService: UserActivityService,
    private appToast:        AppToastService
  ) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    this.error   = false;

    forkJoin({
      global:            this.statsService.getGlobalStats(),
      roles:             this.statsService.getRoleStats(),
      growth:            this.statsService.getGrowth(),
      riskUsers:         this.statsService.getRiskUsers(),
      failedAttempts:    this.statsService.getFailedAttempts(),
      activityDashboard: this.activityService.getDashboard()     // ← single call
    }).subscribe({
      next: (res) => {
        this.global            = res.global;
        this.roles             = res.roles;
        this.growth            = res.growth;
        this.riskUsers         = res.riskUsers;
        this.failedAttempts    = res.failedAttempts;
        this.activityDashboard = res.activityDashboard;
        this.loading           = false;
        this.appToast.showSuccess('Statistics loaded successfully.');
      },
      error: (err) => {
        this.loading = false;
        this.error   = true;
        const msg = err?.error?.message || 'Failed to load statistics.';
        this.appToast.showError(msg);
      }
    });
  }
}