import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-medical-profiles',
  templateUrl: './medical-profiles.component.html',
  styleUrls: ['./medical-profiles.component.scss']
})
export class MedicalProfilesComponent implements OnInit {

  private base = 'http://localhost:8090/peakwell';

  profiles: any[] = [];
  loading = true;
  activeTab: 'all' | 'complete' | 'incomplete' | 'no-data' = 'all';
  searchQuery = '';

  // Modal state
  historyProfile: any = null;
  historyEntries: any[] = [];
  historyLoading = false;

  private avatarColors = ['#fde8d8','#e8f0dd','#fff3e0','#fce4ec','#e8eaf6','#f9fbe7','#e0f7fa','#fce8ff'];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<any[]>(`${this.base}/api/profile/all-with-biometrics`).subscribe({
      next: data => { this.profiles = data; this.loading = false; },
      error: (err) => { console.error('Medical profiles fetch failed:', err); this.loading = false; }
    });
  }

  get tabs(): { key: 'all' | 'complete' | 'incomplete' | 'no-data'; label: string }[] {
    return [
      { key: 'all',        label: 'All'          },
      { key: 'complete',   label: 'Complete'     },
      { key: 'incomplete', label: 'Incomplete'   },
      { key: 'no-data',    label: 'No Biometrics'},
    ];
  }

  countByTab(tab: 'all' | 'complete' | 'incomplete' | 'no-data'): number {
    const base = this.searchFiltered;
    if (tab === 'all')        return base.length;
    if (tab === 'complete')   return base.filter(p => p.complete).length;
    if (tab === 'incomplete') return base.filter(p => !p.complete).length;
    return base.filter(p => p.weight == null).length;
  }

  private get searchFiltered(): any[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.profiles;
    return this.profiles.filter(p =>
      this.patientName(p).toLowerCase().includes(q) ||
      (p.dietitianName ?? '').toLowerCase().includes(q) ||
      (p.bloodType ?? '').toLowerCase().includes(q) ||
      (p.gender ?? '').toLowerCase().includes(q)
    );
  }

  get filtered(): any[] {
    const base = this.searchFiltered;
    if (this.activeTab === 'complete')   return base.filter(p => p.complete);
    if (this.activeTab === 'incomplete') return base.filter(p => !p.complete);
    if (this.activeTab === 'no-data')    return base.filter(p => p.weight == null);
    return base;
  }

  avatarColor(i: number): string { return this.avatarColors[i % this.avatarColors.length]; }

  initials(p: any): string {
    const name = p.studentName ?? ((p.firstName ?? '') + ' ' + (p.lastName ?? ''));
    return name.trim().split(/\s+/).map((w: string) => w[0] ?? '').join('').toUpperCase().slice(0, 2);
  }

  bmiBarWidth(bmi: number | null): string {
    if (!bmi) return '0%';
    return Math.min((bmi / 40) * 100, 100) + '%';
  }

  bmiBarColor(bmi: number | null): string {
    if (!bmi)       return '#b5aaa5';
    if (bmi < 18.5) return '#4ab8f0';
    if (bmi < 25)   return '#7a9e7e';
    if (bmi < 30)   return '#e88f68';
    return '#c96a3f';
  }

  bmiLabel(bmi: number | null): string {
    if (!bmi)       return 'N/A';
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25)   return 'Normal';
    if (bmi < 30)   return 'Overweight';
    return 'Obese';
  }

  patientName(p: any): string {
    return p.studentName || ((p.firstName ?? '') + ' ' + (p.lastName ?? '')).trim() || 'Unknown';
  }

  // ── Biometric history modal ───────────────────────────

  openHistory(p: any): void {
    this.historyProfile = p;
    this.historyEntries = [];
    this.historyLoading = true;
    this.http.get<any[]>(`${this.base}/api/biometrics/profile/${p.id}`).subscribe({
      next: data => {
        this.historyEntries = [...data].reverse(); // newest first
        this.historyLoading = false;
      },
      error: () => { this.historyLoading = false; }
    });
  }

  closeHistory(): void {
    this.historyProfile = null;
    this.historyEntries = [];
  }

  formatDate(dt: string): string {
    if (!dt) return '—';
    return new Date(dt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}
