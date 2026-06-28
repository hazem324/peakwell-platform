import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AiService {

  constructor(private http: HttpClient) {}

  private baseUrl = environment.apiBaseUrl + '/ai';

  generateBanDescription(reason: string): Observable<string> {
    return this.http.post(
      `${this.baseUrl}/generate-ban`,
      { reason },
      { responseType: 'text' } 
    );
  }
}

