import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SportEvent } from '../models/sport-event.model';

@Injectable({
  providedIn: 'root'
})
export class SportEventService {

  private apiUrl = 'http://localhost:8090/peakwell/api/events';

  constructor(private http: HttpClient) {}

  getAllEvents(): Observable<SportEvent[]> {
    return this.http.get<SportEvent[]>(this.apiUrl);
  }

  getEventById(id: number): Observable<SportEvent> {
    return this.http.get<SportEvent>(`${this.apiUrl}/${id}`);
  }

  createEvent(event: SportEvent): Observable<SportEvent> {
    return this.http.post<SportEvent>(this.apiUrl, event);
  }

  updateEvent(id: number, event: SportEvent): Observable<SportEvent> {
    return this.http.put<SportEvent>(`${this.apiUrl}/${id}`, event);
  }

  deleteEvent(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      responseType: 'text'
    });
  }

  uploadImage(formData: FormData): Observable<string> {
    return this.http.post(`${this.apiUrl}/upload`, formData, {
      responseType: 'text'
    });
  }

generateDescription(title: string, category: string, date: string): Observable<string> {
  return this.http.post(`${this.apiUrl}/generate-description`, {
    title,
    category,
    date
  }, {
    responseType: 'text'
  });
}
}