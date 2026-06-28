import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SportEvent } from '../models/sport-event.model';

@Injectable({
  providedIn: 'root'
})
export class RecommendationService {

  private apiUrl = 'http://localhost:8090/peakwell/api/recommendations';

  constructor(private http: HttpClient) {}

  getRecommendations(studentId: number): Observable<SportEvent[]> {
    return this.http.get<SportEvent[]>(`${this.apiUrl}/${studentId}`);
  }
}