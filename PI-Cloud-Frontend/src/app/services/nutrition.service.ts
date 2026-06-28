import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Nutrition } from '../models/nutrition.model';

@Injectable({
  providedIn: 'root'
})
export class NutritionService {

  private apiUrl = 'http://localhost:8090/peakwell/products/api/nutrition';

  constructor(private http: HttpClient) {}

  getNutrition(name: string): Observable<Nutrition> {
    return this.http.get<Nutrition>(`${this.apiUrl}?name=${name}`);
  }
}