import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EventRegistration } from '../models/event-registration.model';
import { AdminEventRegistration } from '../models/admin-event-registration.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class EventRegistrationService {

  private apiUrl = 'http://localhost:8090/peakwell/api/registrations';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  createRegistration(eventId: number): Observable<EventRegistration> {
    return this.http.post<EventRegistration>(
      `${this.apiUrl}/event/${eventId}`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  getRegistrationsByStudentId(studentId: number): Observable<EventRegistration[]> {
    return this.http.get<EventRegistration[]>(
      `${this.apiUrl}/student/${studentId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  getRegistrationsByEventId(eventId: number): Observable<EventRegistration[]> {
    return this.http.get<EventRegistration[]>(
      `${this.apiUrl}/event/${eventId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  getAdminRegistrationsByEventId(eventId: number): Observable<AdminEventRegistration[]> {
    return this.http.get<AdminEventRegistration[]>(
      `${this.apiUrl}/event/${eventId}/admin`,
      { headers: this.getAuthHeaders() }
    );
  }

  updateRegistrationStatus(id: number, status: string): Observable<EventRegistration> {
    return this.http.put<EventRegistration>(
      `${this.apiUrl}/${id}/status?status=${status}`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  deleteRegistration(id: number): Observable<string> {
    return this.http.delete(
      `${this.apiUrl}/${id}`,
      {
        headers: this.getAuthHeaders(),
        responseType: 'text'
      }
    );
  }
}