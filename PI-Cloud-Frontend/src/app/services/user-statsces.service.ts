import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import {
  GlobalStats,
  RoleStat,
  GrowthStat,
  RiskUser,
  FailedAttemptsStat
} from '../features/user/pages/admin-stats-page/admin-stats-page.component';

@Injectable({ providedIn: 'root' })
export class UserStatsService {

  private baseUrl = environment.apiBaseUrl + '/users';

  constructor(private http: HttpClient, private authSer: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authSer.getToken()}` });
  }

  getGlobalStats(): Observable<GlobalStats> {
    return this.http.get<GlobalStats>(`${this.baseUrl}/global`, {
      headers: this.getAuthHeaders()
    });
  }

  getRoleStats(): Observable<RoleStat[]> {
    return this.http.get<RoleStat[]>(`${this.baseUrl}/roles`, {
      headers: this.getAuthHeaders()
    });
  }

  getGrowth(): Observable<GrowthStat[]> {
    return this.http.get<GrowthStat[]>(`${this.baseUrl}/growth`, {
      headers: this.getAuthHeaders()
    });
  }

  getRiskUsers(): Observable<RiskUser[]> {
    return this.http.get<RiskUser[]>(`${this.baseUrl}/risk`, {
      headers: this.getAuthHeaders()
    });
  }

  getFailedAttempts(): Observable<FailedAttemptsStat> {
    return this.http.get<FailedAttemptsStat>(`${this.baseUrl}/failed-attempts`, {
      headers: this.getAuthHeaders()
    });
  }
}