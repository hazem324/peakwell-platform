import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface PatientInsight {
  profileId: number;
  patientName: string;
  willBookSoon: boolean;
  bookingProbability: number;
  bookingConfidence: string;
  dropoutType: string;
  dropoutLabel: number;
  dropoutConfidence: number;
  dropoutProbabilities: { active: number; discouraged: number; healed: number };
  recommendedAction: string;
  weightTrend: number;
  bpSystolicTrend: number;
  glucoseTrend: number;
  daysSinceLastConsultation: number;
  avgRating: number;
  goalProgressPct: number;
}

interface Consultation {
  id: number;
  scheduledAt: string;
  status: string;
  consultationType: string;
  reason: string;
  diagnosis: string | null;
  durationMinutes: number;
  patientName: string;
}

@Component({
  selector: 'app-nutritionist-insights',
  templateUrl: './nutritionist-insights.component.html',
  styleUrls: ['./nutritionist-insights.component.scss']
})
export class NutritionistInsightsComponent implements OnInit {
  private base = 'http://localhost:8090/peakwell/api';

  insights: PatientInsight[] = [];
  consultations: Consultation[] = [];
  loading = true;
  error = '';

  search = '';
  selected: PatientInsight | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<PatientInsight[]>(`${this.base}/insights/patients`).subscribe({
      next: data => { this.insights = data; this.loading = false; },
      error: () => { this.error = 'Failed to load insights.'; this.loading = false; }
    });
    this.http.get<Consultation[]>(`${this.base}/consultations`).subscribe({
      next: data => { this.consultations = data; }
    });
  }

  get filtered(): PatientInsight[] {
    const q = this.search.toLowerCase();
    return this.insights.filter(p =>
      !q || p.patientName.toLowerCase().includes(q) || p.dropoutType.toLowerCase().includes(q)
    );
  }

  select(p: PatientInsight): void { this.selected = p; }

  get patientConsultations(): Consultation[] {
    if (!this.selected) return [];
    return this.consultations
      .filter(c => c.patientName === this.selected!.patientName)
      .slice(0, 5);
  }

  // ── Dropout helpers ────────────────────────────────────
  dropoutColor(type: string): string {
    return type === 'discouraged' ? '#e07878' : type === 'healed' ? '#6da47a' : '#7a9eb8';
  }

  dropoutBg(type: string): string {
    return type === 'discouraged' ? '#fff5f5' : type === 'healed' ? '#edf7f0' : '#f0f4fb';
  }

  dropoutLabel(type: string): string {
    return type === 'discouraged' ? 'Discouraged' : type === 'healed' ? 'Healed' : 'Active';
  }

  dropoutIcon(type: string): string {
    return type === 'discouraged' ? '😔' : type === 'healed' ? '🎉' : '✓';
  }

  // ── Trend helpers ──────────────────────────────────────
  trendArrow(val: number): string {
    if (val > 0.5) return '↑';
    if (val < -0.5) return '↓';
    return '→';
  }

  trendClass(val: number, inverse = false): string {
    const up = val > 0.5;
    const down = val < -0.5;
    if (up) return inverse ? 'trend-bad' : 'trend-good';
    if (down) return inverse ? 'trend-good' : 'trend-bad';
    return 'trend-neutral';
  }

  // ── Star rating ────────────────────────────────────────
  stars(rating: number): string {
    const full = Math.round(rating);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  }

  // ── Consultation helpers ───────────────────────────────
  statusClass(status: string): string {
    const map: Record<string, string> = {
      COMPLETED: 'badge-green', UPCOMING: 'badge-blue',
      REJECTED: 'badge-red', CANCELLED: 'badge-red',
      PENDING_APPROVAL: 'badge-yellow'
    };
    return map[status] ?? 'badge-gray';
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      COMPLETED: 'Completed', UPCOMING: 'Upcoming',
      REJECTED: 'Refused', CANCELLED: 'Cancelled', PENDING_APPROVAL: 'Pending'
    };
    return map[status] ?? status;
  }

  formatDate(dt: string): string {
    try {
      return new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return dt; }
  }

  initials(name: string): string {
    if (!name) return '?';
    const p = name.trim().split(' ');
    return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase();
  }

  avatarColor(name: string): string {
    const palette = ['#fde8d8','#e8f0dd','#fff3e0','#fce4ec','#e8eaf6','#e0f7fa'];
    if (!name) return '#f0ebe6';
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return palette[Math.abs(h) % palette.length];
  }
}