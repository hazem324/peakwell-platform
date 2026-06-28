import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ActivitySummary {
  total:       number;
  success:     number;
  failed:      number;
  successRate: number;
}

export interface ActivityByType {
  action: string;
  count:  number;
}

export interface RecentActivity {
  id:           number;
  userEmail:    string;
  userFullName: string;
  action:       string;
  description:  string;
  status:       string;
  ipAddress:    string;
  userAgent:    string;
  createdAt:    string;
}

export interface ActivityPerDay {
  date:  string;
  count: number;
}

export interface TopIp {
  ipAddress: string;
  count:     number;
}

export interface TopUserAgent {
  userAgent: string;
  count:     number;
}

export interface ActivityByHour {
  hour:  number;
  count: number;
}

export interface ActionStatusBreakdown {
  action: string;
  status: string;
  count:  number;
}

export interface MostActiveUser {
  email:         string;
  fullName:      string;
  activityCount: number;
}

export interface ActivityDashboard {
  summary:             ActivitySummary;
  byType:              ActivityByType[];
  recentActivity:      RecentActivity[];
  activityPerDay:      ActivityPerDay[];
  failedPerDay:        ActivityPerDay[];
  topIps:              TopIp[];
  topUserAgents:       TopUserAgent[];
  byHour:              ActivityByHour[];
  actionStatusBreakdown: ActionStatusBreakdown[];
  mostActiveUsers:     MostActiveUser[];
}

@Injectable({ providedIn: 'root' })
export class UserActivityService {

  private baseUrl = environment.apiBaseUrl + '/activity';

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<ActivityDashboard> {
    return this.http.get<ActivityDashboard>(`${this.baseUrl}/dashboard`);
  }

  getSummary(): Observable<ActivitySummary> {
    return this.http.get<ActivitySummary>(`${this.baseUrl}/summary`);
  }

  getByType(): Observable<ActivityByType[]> {
    return this.http.get<ActivityByType[]>(`${this.baseUrl}/by-type`);
  }

  getRecentActivity(limit = 20): Observable<RecentActivity[]> {
    return this.http.get<RecentActivity[]>(`${this.baseUrl}/recent`, { params: { limit } });
  }

  getActivityPerDay(): Observable<ActivityPerDay[]> {
    return this.http.get<ActivityPerDay[]>(`${this.baseUrl}/per-day`);
  }

  getFailedPerDay(): Observable<ActivityPerDay[]> {
    return this.http.get<ActivityPerDay[]>(`${this.baseUrl}/failed-per-day`);
  }

  getTopIps(limit = 10): Observable<TopIp[]> {
    return this.http.get<TopIp[]>(`${this.baseUrl}/top-ips`, { params: { limit } });
  }

  getTopUserAgents(limit = 10): Observable<TopUserAgent[]> {
    return this.http.get<TopUserAgent[]>(`${this.baseUrl}/top-agents`, { params: { limit } });
  }

  getByHour(): Observable<ActivityByHour[]> {
    return this.http.get<ActivityByHour[]>(`${this.baseUrl}/by-hour`);
  }

  getActionStatusBreakdown(): Observable<ActionStatusBreakdown[]> {
    return this.http.get<ActionStatusBreakdown[]>(`${this.baseUrl}/action-status`);
  }

  getMostActiveUsers(limit = 10): Observable<MostActiveUser[]> {
    return this.http.get<MostActiveUser[]>(`${this.baseUrl}/most-active`, { params: { limit } });
  }

  getUserActivity(userId: number, limit = 50): Observable<RecentActivity[]> {
    return this.http.get<RecentActivity[]>(`${this.baseUrl}/user/${userId}`, { params: { limit } });
  }
}