import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {

  private api = 'http://localhost:8090/peakwell/reservations';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // headers avec token
  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  // TOGGLE (réserver / annuler)
  toggleReservation(menuId: number): Observable<void> {
    return this.http.put<void>(
      `${this.api}/${menuId}`,
      {},
      { headers: this.getHeaders() }
    );
  }

  // COUNT TOTAL (pour restaurant)
  getReservationCount(menuId: number): Observable<number> {
    return this.http.get<number>(
      `${this.api}/count/${menuId}`
    );
  }

  // CHECK USER (déjà réservé ?)
  isReserved(menuId: number): Observable<boolean> {
    return this.http.get<boolean>(
      `${this.api}/check/${menuId}`,
      { headers: this.getHeaders() }
    );
  }

  reservePlan(planId: number) {
    return this.http.post(
      `http://localhost:8090/peakwell/reservations/plan/${planId}`,
      {},
      { headers: this.getHeaders() }
    );
  }

  isPlanReserved(planId: number) {
    return this.http.get<boolean>(
      `http://localhost:8090/peakwell/reservations/plan/${planId}/isReserved`,
      { headers: this.getHeaders() }
    );
  }

  cancelPlan(planId: number) {
    return this.http.delete(
      `http://localhost:8090/peakwell/reservations/plan/${planId}`,
      { headers: this.getHeaders() }
    );
  }
}