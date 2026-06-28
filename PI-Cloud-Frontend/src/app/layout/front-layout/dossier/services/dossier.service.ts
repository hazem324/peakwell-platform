import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap, catchError, of } from 'rxjs';
import { ApiService, MedicalProfileResponse, BiometricResponse, BiometricRequest, MedicalProfileRequest, HealthAlertDto } from './api.service';

@Injectable({ providedIn: 'root' })
export class DossierService {

  private profileSubject  = new BehaviorSubject<MedicalProfileResponse | null>(null);
  private entriesSubject  = new BehaviorSubject<BiometricResponse[]>([]);
  private loadingSubject  = new BehaviorSubject<boolean>(false);

  profile$  = this.profileSubject.asObservable();
  entries$  = this.entriesSubject.asObservable();
  loading$  = this.loadingSubject.asObservable();

  constructor(private api: ApiService) {}

  get profile(): MedicalProfileResponse | null { return this.profileSubject.getValue(); }
  get entries(): BiometricResponse[]           { return this.entriesSubject.getValue(); }
  get latest(): BiometricResponse | null {
    const e = this.entries;
    return e.length ? e[e.length - 1] : null;
  }
  get previous(): BiometricResponse | null {
    const e = this.entries;
    return e.length >= 2 ? e[e.length - 2] : null;
  }

  // ── Load on init ─────────────────────────────────
  loadProfile(): void {
    this.api.getProfile().pipe(
      catchError(() => of(null))
    ).subscribe(p => this.profileSubject.next(p));
  }

  loadBiometrics(): void {
    this.api.getBiometrics().pipe(
      catchError(() => of([]))
    ).subscribe(entries => this.entriesSubject.next(entries));
  }

  // ── Save Profile ─────────────────────────────────
  saveProfile(data: MedicalProfileRequest): Observable<MedicalProfileResponse> {
    const isExisting = !!this.profile?.id;
    const call = isExisting ? this.api.updateProfile(data) : this.api.saveProfile(data);
    return call.pipe(
      tap(saved => this.profileSubject.next(saved))
    );
  }

  // ── Add Biometric ─────────────────────────────────
  addBiometric(data: BiometricRequest): Observable<BiometricResponse> {
    return this.api.addBiometric(data).pipe(
      tap(entry => {
        this.entriesSubject.next([...this.entries, entry]);
      })
    );
  }

  // ── Delete Biometric ──────────────────────────────
  deleteBiometric(id: number): Observable<void> {
    return this.api.deleteBiometric(id).pipe(
      tap(() => {
        this.entriesSubject.next(this.entries.filter(e => e.id !== id));
      })
    );
  }

  // ── Alerts ────────────────────────────────────────
  getAlerts(): Observable<HealthAlertDto[]> {
    return this.api.getAlerts().pipe(
      catchError(() => of([]))
    );
  }

  // ── Helpers ───────────────────────────────────────
  calculateBMI(weight: number, height: number): number {
    if (!weight || !height) return 0;
    return Math.round((weight / Math.pow(height / 100, 2)) * 10) / 10;
  }

  getBMICategory(bmi: number): { label: string; color: string } {
    if (bmi < 18.5) return { label: 'Underweight', color: '#4ab8f0' };
    if (bmi < 25)   return { label: 'Normal',      color: '#7a9e7e' };
    if (bmi < 30)   return { label: 'Overweight',  color: '#e88f68' };
    return               { label: 'Obese',         color: '#c96a3f' };
  }
}