import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Plan } from '../models/plan.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class PlanService {

  private api = 'http://localhost:8090/peakwell/plan/today';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders() {
    const token = this.authService.getToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }


    getPlan() {
    return this.http.get<Plan>(this.api, {
        headers: this.getHeaders()
    });
    }
}