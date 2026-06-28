import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EventReview } from '../models/event-review.model';
import { AdminEventReview } from '../models/admin-event-review.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class EventReviewService {

  private apiUrl = 'http://localhost:8090/peakwell/api/reviews';

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

  createReview(eventId: number, payload: EventReview): Observable<EventReview> {
    return this.http.post<EventReview>(
      `${this.apiUrl}/event/${eventId}`,
      payload,
      { headers: this.getAuthHeaders() }
    );
  }

  getReviewsByEventId(eventId: number): Observable<EventReview[]> {
    return this.http.get<EventReview[]>(
      `${this.apiUrl}/event/${eventId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  getAdminReviewsByEventId(eventId: number): Observable<AdminEventReview[]> {
    return this.http.get<AdminEventReview[]>(
      `${this.apiUrl}/event/${eventId}/admin`,
      { headers: this.getAuthHeaders() }
    );
  }

  updateReview(id: number, payload: EventReview): Observable<EventReview> {
    return this.http.put<EventReview>(
      `${this.apiUrl}/${id}`,
      payload,
      { headers: this.getAuthHeaders() }
    );
  }

  deleteReview(reviewId: number): Observable<string> {
    return this.http.delete(
      `${this.apiUrl}/${reviewId}`,
      {
        headers: this.getAuthHeaders(),
        responseType: 'text'
      }
    );
  }

  getReviewsByStudentId(studentId: number): Observable<EventReview[]> {
    return this.http.get<EventReview[]>(
      `${this.apiUrl}/student/${studentId}`,
      { headers: this.getAuthHeaders() }
    );
  }
}