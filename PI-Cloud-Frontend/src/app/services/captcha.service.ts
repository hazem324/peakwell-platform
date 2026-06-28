import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';



export interface CaptchaChallenge {
  challengeToken: string;
  category: string;
  imageUrls: string[];
}

export interface CaptchaVerifyResponse {
  success: boolean;
  captchaToken: string | null;
  message: string | null;
}

@Injectable({ providedIn: 'root' })
export class CaptchaService {

  private apiBaseUrl = `${environment.apiBaseUrl}/captcha`;

  constructor(private http: HttpClient) {}

  getChallenge(): Observable<CaptchaChallenge> {
    return this.http.get<CaptchaChallenge>(`${this.apiBaseUrl}/challenge`);
  }

  verify(challengeToken: string, selectedIndices: number[]): Observable<CaptchaVerifyResponse> {
    return this.http.post<CaptchaVerifyResponse>(`${this.apiBaseUrl}/verify`, {
      challengeToken,
      selectedIndices
    });
  }
}