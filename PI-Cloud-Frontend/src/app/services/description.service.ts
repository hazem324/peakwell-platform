import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DescriptionResponse } from '../models/description.model';

@Injectable({
  providedIn: 'root'
})
export class DescriptionService {

  private apiUrl = 'http://localhost:8090/peakwell/products/generate-description';

  constructor(private http: HttpClient) {}

  generate(name: string): Observable<DescriptionResponse> {
    return this.http.post<DescriptionResponse>(
      `${this.apiUrl}?name=${name}`, 
      {}
    );
  }
}