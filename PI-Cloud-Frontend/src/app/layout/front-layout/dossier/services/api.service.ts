import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../../../../services/auth.service';

export interface MedicalProfileRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  bloodType: string;
  height: number;
  emergencyContact: string;
  allergies: string[];
  conditions: string[];
  medications: string[];
}

export interface MedicalProfileResponse {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  bloodType: string;
  height: number;
  emergencyContact: string;
  allergies: string[];
  conditions: string[];
  medications: string[];
  complete: boolean;
}

export interface BiometricRequest {
  weight: number;
  height: number;
  bodyFat?: number | null;
  muscleMass?: number | null;
  systolic?: number | null;
  diastolic?: number | null;
  glucose?: number | null;
  notes?: string;
}

export interface BiometricResponse {
  id: number;
  weight: number;
  height: number;
  bmi: number;
  bodyFat: number | null;
  muscleMass: number | null;
  systolic: number | null;
  diastolic: number | null;
  glucose: number | null;
  notes: string;
  recordedAt: string;
}

export interface HealthAlertDto {
  type: string;
  metric: string;
  message: string;
  value: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {

  private base = 'http://localhost:8090/peakwell/api';

  constructor(private http: HttpClient, private auth: AuthService) {}

  private get headers(): HttpHeaders {
    const token = this.auth.getToken();
    return token ? new HttpHeaders({ 'Authorization': `Bearer ${token}` }) : new HttpHeaders();
  }

  // ── Medical Profile ──────────────────────────────
  getProfile(): Observable<MedicalProfileResponse> {
    return this.http.get<MedicalProfileResponse>(`${this.base}/profile`, { headers: this.headers });
  }

  saveProfile(data: MedicalProfileRequest): Observable<MedicalProfileResponse> {
    return this.http.post<MedicalProfileResponse>(`${this.base}/profile`, data, { headers: this.headers });
  }

  updateProfile(data: MedicalProfileRequest): Observable<MedicalProfileResponse> {
    return this.http.put<MedicalProfileResponse>(`${this.base}/profile`, data, { headers: this.headers });
  }

  // ── Biometrics ───────────────────────────────────
  getBiometrics(): Observable<BiometricResponse[]> {
    return this.http.get<BiometricResponse[]>(`${this.base}/biometrics`, { headers: this.headers });
  }

  addBiometric(data: BiometricRequest): Observable<BiometricResponse> {
    return this.http.post<BiometricResponse>(`${this.base}/biometrics`, data, { headers: this.headers });
  }

  getLatestBiometric(): Observable<BiometricResponse> {
    return this.http.get<BiometricResponse>(`${this.base}/biometrics/latest`, { headers: this.headers });
  }

  deleteBiometric(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/biometrics/${id}`, { headers: this.headers });
  }

  getAlerts(): Observable<HealthAlertDto[]> {
    return this.http.get<HealthAlertDto[]>(`${this.base}/biometrics/alerts`, { headers: this.headers });
  }
}