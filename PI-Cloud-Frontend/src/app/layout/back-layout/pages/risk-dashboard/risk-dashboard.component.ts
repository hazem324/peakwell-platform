import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastServiceService } from '../../../../services/toast-service.service';

@Component({
  selector: 'app-risk-dashboard',
  templateUrl: './risk-dashboard.component.html',
  styleUrls: ['./risk-dashboard.component.scss']
})
export class RiskDashboardComponent implements OnInit {
  private apiBase = 'http://localhost:8090/peakwell/api/risk-profile';

  modelLoaded = false;
  loading = false;
  patients: any[] = [];
  selectedPatient: any = null;
  filterTier = '';

  constructor(private http: HttpClient, private router: Router, private toastService: ToastServiceService) {}

  ngOnInit(): void {
    this.http.get<any>(`${this.apiBase}/status`).subscribe({
      next: r => { this.modelLoaded = r.modelLoaded; if (r.modelLoaded) this.loadAll(); },
      error: () => this.modelLoaded = false
    });
  }

  loadAll(): void {
    this.loading = true;
    this.http.get<any[]>(`${this.apiBase}/all`).subscribe({
      next: r => { this.patients = r; this.loading = false; },
      error: () => { this.loading = false; this.toastService.show('❌ Failed to load risk profiles'); }
    });
  }

  get filteredPatients(): any[] {
    if (!this.filterTier) return this.patients;
    return this.patients.filter(p => p.riskTier === this.filterTier);
  }

  get tierCounts(): { tier: string; count: number; color: string; icon: string }[] {
    return [
      { tier: 'Red',    count: this.patients.filter(p => p.riskTier === 'Red').length,    color: '#c96a3f', icon: '🔴' },
      { tier: 'Orange', count: this.patients.filter(p => p.riskTier === 'Orange').length, color: '#e88f68', icon: '🟠' },
      { tier: 'Yellow', count: this.patients.filter(p => p.riskTier === 'Yellow').length, color: '#e8c840', icon: '🟡' },
      { tier: 'Green',  count: this.patients.filter(p => p.riskTier === 'Green').length,  color: '#7a9e7e', icon: '🟢' },
    ];
  }

  toggleFilter(tier: string): void {
    this.filterTier = this.filterTier === tier ? '' : tier;
  }

  selectPatient(p: any): void { this.selectedPatient = p; }
  closeDetail(): void { this.selectedPatient = null; }

  openDossier(profileId: number): void {
    this.router.navigate(['/admin/dossier', profileId]);
  }

  tierColor(tier: string): string {
    const m: Record<string, string> = { Green: '#7a9e7e', Yellow: '#e8c840', Orange: '#e88f68', Red: '#c96a3f' };
    return m[tier] ?? '#8a7e78';
  }
  tierBg(tier: string): string {
    const m: Record<string, string> = {
      Green: 'rgba(122,158,126,0.08)', Yellow: 'rgba(232,200,64,0.08)',
      Orange: 'rgba(232,143,104,0.08)', Red: 'rgba(201,106,63,0.08)'
    };
    return m[tier] ?? '#faf7f4';
  }
  tierIcon(tier: string): string {
    const m: Record<string, string> = { Green: '🟢', Yellow: '🟡', Orange: '🟠', Red: '🔴' };
    return m[tier] ?? '⚪';
  }
  impactIcon(impact: string): string { return impact === 'High' ? '🔴' : '🟡'; }
  scoreColor(score: number): string {
    if (score >= 70) return '#7a9e7e';
    if (score >= 40) return '#e88f68';
    return '#c96a3f';
  }
}