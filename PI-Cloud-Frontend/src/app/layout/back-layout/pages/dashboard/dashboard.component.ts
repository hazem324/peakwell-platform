import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface ConsultationResponse {
  id: number;
  scheduledAt: string;
  status: string;
  doctorName: string;
  doctorSpecialty: string;
  consultationType: string;
  priority: string;
  durationMinutes: number;
  rating: Record<string, any> | null;
  patientName: string;
  completedAt: string;
  reason: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  private base = 'http://localhost:8090/peakwell';

  // ── Raw data ─────────────────────────────────────────
  consultations: ConsultationResponse[] = [];
  consultLoading = true;
  consultError   = false;

  students: any[] = [];
  studentsLoading = true;


  private avatarColors = ['#fde8d8','#e8f0dd','#fff3e0','#fce4ec','#e8eaf6','#f9fbe7','#e0f7fa','#fce8ff'];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<ConsultationResponse[]>(`${this.base}/api/consultations`).subscribe({
      next: data => { this.consultations = data; this.consultLoading = false; },
      error: ()   => { this.consultError = true;  this.consultLoading = false; }
    });

    this.http.get<any[]>(`${this.base}/student/all`).subscribe({
      next: data => { this.students = data; this.studentsLoading = false; },
      error: ()   => { this.studentsLoading = false; }
    });

  }

  // ── KPI Cards ─────────────────────────────────────────

  get kpiCards(): { label: string; value: string; change: string; positive: boolean; icon: string; color: string }[] {
    return [
      {
        label: 'Registered Users',
        value: this.studentsLoading ? '…' : String(this.students.length),
        change: `${this.newThisMonth} new this month`,
        positive: true, icon: '👥', color: 'terra'
      },
      {
        label: 'Consultations This Month',
        value: this.consultLoading ? '…' : String(this.sessionsThisMonth),
        change: `${this.upcomingConsultations.length} upcoming`,
        positive: true, icon: '📅', color: 'sage'
      },
      {
        label: 'Total Consultations',
        value: this.consultLoading ? '…' : String(this.consultations.length),
        change: `${this.completedCount} completed`,
        positive: true, icon: '📋', color: 'warm'
      },
      {
        label: 'Cancelled / No-Shows',
        value: this.consultLoading ? '…' : String(this.consultations.filter(c => c.status === 'CANCELLED' || c.status === 'NO_SHOW').length),
        change: `${this.ratedCount} rated sessions`,
        positive: false, icon: '🚫', color: 'terra'
      },
    ];
  }

  // ── Consultation computed ─────────────────────────────

  get sessionsThisMonth(): number {
    const now = new Date();
    return this.consultations.filter(c => {
      const d = new Date(c.scheduledAt);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;
  }

  get upcomingConsultations(): ConsultationResponse[] {
    const now = new Date();
    return this.consultations
      .filter(c => new Date(c.scheduledAt) > now && c.status !== 'CANCELLED')
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  }

  get completedCount(): number { return this.consultations.filter(c => c.status === 'COMPLETED').length; }
  get ratedCount(): number     { return this.consultations.filter(c => c.rating?.['overallRating']).length; }

  get avgRating(): string {
    const rated = this.consultations.filter(c => c.rating?.['overallRating']);
    if (!rated.length) return '—';
    return (rated.reduce((s, c) => s + Number(c.rating!['overallRating']), 0) / rated.length).toFixed(1);
  }

  get completedThisMonth(): number {
    const now = new Date();
    return this.consultations.filter(c => {
      if (c.status !== 'COMPLETED') return false;
      const d = new Date(c.completedAt || c.scheduledAt);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;
  }

  get consultKpiCards(): { label: string; value: string; icon: string; sub: string; colorClass: string }[] {
    return [
      { label: 'Total Consultations',  value: String(this.consultations.length),        icon: '🩺', sub: 'all time',      colorClass: 'ck-blue'  },
      { label: 'Upcoming',             value: String(this.upcomingConsultations.length), icon: '📅', sub: 'scheduled',     colorClass: 'ck-green' },
      { label: 'Completed This Month', value: String(this.completedThisMonth),           icon: '✅', sub: 'this month',    colorClass: 'ck-terra' },
      { label: 'Avg Rating',           value: this.avgRating === '—' ? '—' : '★ ' + this.avgRating, icon: '⭐', sub: 'from ratings', colorClass: 'ck-gold' },
    ];
  }

  // ── Today's appointments ──────────────────────────────

  get todayConsultations(): ConsultationResponse[] {
    const today = new Date().toDateString();
    return this.consultations
      .filter(c => new Date(c.scheduledAt).toDateString() === today)
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  }

  appointmentDotColor(c: ConsultationResponse): string {
    const map: Record<string, string> = { URGENT: '#c96a3f', NORMAL: '#4ab8f0', LOW: '#7a9e7e' };
    return map[c.priority] ?? '#4ab8f0';
  }

  // ── Platform stats (admin) ────────────────────────────

  get activeStudents(): number   { return this.students.filter(s => s.enabled !== false).length; }
  get inactiveStudents(): number { return this.students.filter(s => s.enabled === false).length; }
  get newThisMonth(): number {
    const now = new Date();
    return this.students.filter(s => {
      const d = new Date(s.createdAt ?? s.registeredAt ?? 0);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;
  }
  get userDistribution(): { label: string; count: number; pct: number; color: string }[] {
    const total = this.students.length || 1;
    return [
      { label: 'Active',   count: this.activeStudents,   pct: Math.round(this.activeStudents   / total * 100), color: '#7a9e7e' },
      { label: 'Inactive', count: this.inactiveStudents, pct: Math.round(this.inactiveStudents / total * 100), color: '#c5bdb7' },
    ];
  }

  // ── Platform alerts (admin) ───────────────────────────

  get platformAlerts(): { icon: string; title: string; message: string; type: 'warn' | 'info' | 'ok' }[] {
    const alerts: { icon: string; title: string; message: string; type: 'warn' | 'info' | 'ok' }[] = [];
    const cancelled = this.consultations.filter(c => c.status === 'CANCELLED').length;
    const noShow    = this.consultations.filter(c => c.status === 'NO_SHOW').length;
    const inactive  = this.inactiveStudents;
    const newUsers  = this.newThisMonth;

    if (cancelled > 0)
      alerts.push({ icon: '🚫', title: 'Cancelled Sessions', message: `${cancelled} consultation(s) cancelled`, type: 'warn' });
    if (noShow > 0)
      alerts.push({ icon: '⚠️', title: 'No-Shows',           message: `${noShow} patient(s) did not attend`,    type: 'warn' });
    if (inactive > 0)
      alerts.push({ icon: '🔴', title: 'Inactive Users',      message: `${inactive} account(s) disabled`,        type: 'warn' });
    if (newUsers > 0)
      alerts.push({ icon: '🆕', title: 'New Registrations',   message: `${newUsers} new user(s) this month`,     type: 'info' });
    return alerts;
  }

  // ── Students ─────────────────────────────────────────

  get recentStudents(): any[] { return this.students.slice(0, 8); }

  studentInitials(s: any): string {
    return ((s.firstName?.[0] ?? '') + (s.lastName?.[0] ?? '')).toUpperCase();
  }

  studentAvatarColor(i: number): string { return this.avatarColors[i % this.avatarColors.length]; }

  bmiBarWidth(bmi: number | null): string {
    if (!bmi) return '0%';
    return Math.min((bmi / 40) * 100, 100) + '%';
  }

  bmiBarColor(bmi: number | null): string {
    if (!bmi)    return '#b5aaa5';
    if (bmi < 18.5) return '#4ab8f0';
    if (bmi < 25)   return '#7a9e7e';
    if (bmi < 30)   return '#e88f68';
    return '#c96a3f';
  }

  studentStatus(s: any): string { return s.enabled ? 'active' : 'inactive'; }

  // ── Helpers ───────────────────────────────────────────

  statusColor(status: string): string {
    const map: Record<string, string> = { active: '#7a9e7e', inactive: '#b5aaa5' };
    return map[status] ?? '#b5aaa5';
  }

  alertIcon(type: string): string {
    return type === 'danger' ? '🚨' : type === 'warning' ? '⚠️' : 'ℹ️';
  }

  typeIcon(t: string): string {
    const map: Record<string, string> = { IN_PERSON: '🏥', VIDEO_CALL: '📹', PHONE: '📞' };
    return map[t] ?? '📋';
  }

  formatDate(dt: string | null): string {
    if (!dt) return '—';
    return new Date(dt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  formatTime(dt: string): string {
    return new Date(dt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  consultStatusClass(status: string): string {
    const map: Record<string, string> = {
      UPCOMING: 'cs-blue', SCHEDULED: 'cs-blue', COMPLETED: 'cs-green',
      CANCELLED: 'cs-red',  RESCHEDULED: 'cs-orange', NO_SHOW: 'cs-gray'
    };
    return map[status] ?? 'cs-gray';
  }
}
