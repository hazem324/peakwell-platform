import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface EventPredictionRequest {
  category: 'SPORT' | 'CINEMA' | 'KARAOKE' | 'CEREMONY' | 'OTHER';
  location: string;
  eventDate: string;
  maxParticipants: number;
}

export interface EventPredictionResponse {
  prediction: 'LOW' | 'MEDIUM' | 'HIGH';
  resolved_governorate: string;
  confidence?: number;
  features_used?: {
    category: string;
    hour: number;
    dayOfWeek: number;
    month: number;
    maxParticipants: number;
  };
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AiPredictionService {

  private apiUrl = 'http://localhost:8004';

  constructor(private http: HttpClient) {}

  predictEvent(data: EventPredictionRequest): Observable<EventPredictionResponse> {
    return this.http.post<EventPredictionResponse>(`${this.apiUrl}/predict`, data);
  }
}