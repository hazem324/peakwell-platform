import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../../services/auth.service';
import { ToastServiceService } from '../../../../services/toast-service.service';

interface ConsultationResponse {
  id: number;
  scheduledAt: string;
  status: string;
  doctorName: string;
  doctorSpecialty: string;
  consultationType: string;
  priority: string;
  durationMinutes: number;
  patientName: string;
  reason: string;
}

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

@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.scss']
})
export class ScheduleComponent implements OnInit {

  private base = 'http://localhost:8090/peakwell';

  consultations: ConsultationResponse[] = [];
  loading = true;

  weekStart: Date = this.getMondayOfCurrentWeek();
  dietitianName = '';

  // Fixed time slots 08:00 – 18:00
  readonly timeSlots = [
    '08:00','09:00','10:00','11:00','12:00',
    '13:00','14:00','15:00','16:00','17:00','18:00'
  ];

  // ── Working Hours ──────────────────────────────────────
  readonly dayOptions = [
    { value: 'MONDAY',    label: 'Lun' },
    { value: 'TUESDAY',   label: 'Mar' },
    { value: 'WEDNESDAY', label: 'Mer' },
    { value: 'THURSDAY',  label: 'Jeu' },
    { value: 'FRIDAY',    label: 'Ven' },
    { value: 'SATURDAY',  label: 'Sam' },
    { value: 'SUNDAY',    label: 'Dim' },
  ];

  readonly hours = [6,7,8,9,10,11,12,13,14,15,16,17,18,19,20];

  workingDays: string[]  = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY'];
  workStartHour: number  = 9;
  workEndHour: number    = 17;
  savingSchedule         = false;

  // ── AI Insights ───────────────────────────────────
  insights: PatientInsight[] = [];
  insightsLoading = false;
  showInsights = false;
  private insightsBase = 'http://localhost:8090/peakwell/api/insights';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    public  toastService: ToastServiceService
  ) {}

  ngOnInit(): void {
    this.http.get<ConsultationResponse[]>(`${this.base}/api/consultations`).subscribe({
      next: data => { this.consultations = data; this.loading = false; },
      error: ()   => { this.loading = false; }
    });

    const cached = this.authService.currentUser;
    if (cached) this.dietitianName = `${cached.firstName ?? ''} ${cached.lastName ?? ''}`.trim();

    this.authService.fetchCurrentUser().subscribe(user => {
      if (user) this.dietitianName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
    });

    this.loadSchedule();
    this.loadInsights();
  }

  // ── AI Insights ──────────────────────────────────────

  loadInsights(): void {
    this.insightsLoading = true;
    this.http.get<PatientInsight[]>(`${this.insightsBase}/patients`).subscribe({
      next: data => { this.insights = data; this.insightsLoading = false; },
      error: () => { this.insightsLoading = false; }
    });
  }

  get atRiskPatients(): PatientInsight[] {
    return this.insights.filter(i => i.dropoutType !== 'active');
  }

  get willingToBook(): PatientInsight[] {
    return this.insights.filter(i => i.willBookSoon);
  }

  dropoutIcon(type: string): string {
    return type === 'discouraged' ? '😔' : type === 'healed' ? '🎉' : '✓';
  }

  dropoutColor(type: string): string {
    return type === 'discouraged' ? '#e07878' : type === 'healed' ? '#6da47a' : '#b5aaa5';
  }

  trendArrow(val: number): string {
    if (val > 0.5) return '↑';
    if (val < -0.5) return '↓';
    return '→';
  }

  trendClass(val: number, inverse = false): string {
    if (val > 0.5) return inverse ? 'trend-bad' : 'trend-good';
    if (val < -0.5) return inverse ? 'trend-good' : 'trend-bad';
    return 'trend-neutral';
  }

  avatarColor(name: string | null): string {
    if (!name) return '#f0ebe6';
    const palette = ['#fde8d8','#e8f0dd','#fff3e0','#fce4ec','#e8eaf6','#f9fbe7','#e0f7fa','#fbe9e7'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return palette[Math.abs(hash) % palette.length];
  }

  initials(name: string | null): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
  }

  // ── Working Hours ──────────────────────────────────────

  loadSchedule(): void {
    this.http.get<any>(`${this.base}/dietitian/schedule`).subscribe({
      next: s => {
        if (s.workingDays)           this.workingDays  = s.workingDays;
        if (s.workStartHour != null) this.workStartHour = s.workStartHour;
        if (s.workEndHour   != null) this.workEndHour   = s.workEndHour;
      },
      error: () => {} // keep defaults if not configured yet
    });
  }

  toggleDay(day: string): void {
    const idx = this.workingDays.indexOf(day);
    if (idx >= 0) this.workingDays.splice(idx, 1);
    else          this.workingDays.push(day);
  }

  isDayActive(day: string): boolean { return this.workingDays.includes(day); }

  saveSchedule(): void {
    if (this.workStartHour >= this.workEndHour) {
      this.toastService.show('⚠️ L\'heure de fin doit être après l\'heure de début');
      return;
    }
    if (this.workingDays.length === 0) {
      this.toastService.show('⚠️ Sélectionnez au moins un jour de travail');
      return;
    }
    this.savingSchedule = true;
    this.http.patch(`${this.base}/dietitian/schedule`, {
      workingDays:  this.workingDays,
      workStartHour: this.workStartHour,
      workEndHour:   this.workEndHour
    }).subscribe({
      next: () => {
        this.savingSchedule = false;
        this.toastService.show('✅ Emploi du temps enregistré');
      },
      error: () => {
        this.savingSchedule = false;
        this.toastService.show('❌ Erreur lors de la sauvegarde');
      }
    });
  }

  // ── Week navigation ────────────────────────────────────

  private getMondayOfCurrentWeek(): Date {
    const today = new Date();
    const day   = today.getDay();
    const diff  = day === 0 ? -6 : 1 - day;
    const mon   = new Date(today);
    mon.setDate(today.getDate() + diff);
    mon.setHours(0, 0, 0, 0);
    return mon;
  }

  prevWeek(): void { const d = new Date(this.weekStart); d.setDate(d.getDate() - 7); this.weekStart = d; }
  nextWeek(): void { const d = new Date(this.weekStart); d.setDate(d.getDate() + 7); this.weekStart = d; }
  goToToday(): void { this.weekStart = this.getMondayOfCurrentWeek(); }

  get weekLabel(): string {
    const end = new Date(this.weekStart);
    end.setDate(end.getDate() + 4);
    const s = this.weekStart;
    if (s.getMonth() === end.getMonth())
      return `${s.toLocaleDateString('fr-FR', { month: 'long' })} ${s.getDate()} – ${end.getDate()}, ${end.getFullYear()}`;
    return `${s.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }

  // ── Week days (Mon – Fri + weekends if working) ────────

  get weekDays(): { label: string; dateStr: string; dayNum: string; isToday: boolean; dayName: string }[] {
    const today = new Date().toDateString();
    const dayNames = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
    return [0, 1, 2, 3, 4].map(i => {
      const d = new Date(this.weekStart);
      d.setDate(d.getDate() + i);
      return {
        label:   d.toLocaleDateString('fr-FR', { weekday: 'short' }).toUpperCase(),
        dateStr: d.toDateString(),
        dayNum:  String(d.getDate()),
        isToday: d.toDateString() === today,
        dayName: dayNames[d.getDay()]
      };
    });
  }

  isWorkingDay(dayName: string): boolean { return this.workingDays.includes(dayName); }

  isWorkingHour(slot: string): boolean {
    const h = parseInt(slot.split(':')[0]);
    return h >= this.workStartHour && h < this.workEndHour;
  }

  // ── Consultations ──────────────────────────────────────

  get weekConsultations(): ConsultationResponse[] {
    const start = this.weekStart;
    const end   = new Date(start);
    end.setDate(end.getDate() + 5);
    return this.consultations.filter(c => {
      const d      = new Date(c.scheduledAt);
      const inWeek = d >= start && d < end;
      const forMe  = !this.dietitianName || c.doctorName === this.dietitianName;
      const visible = c.status !== 'REJECTED' && c.status !== 'CANCELLED';
      return inWeek && forMe && visible;
    });
  }

  getConsultationsForSlot(dayStr: string, slotHour: string): ConsultationResponse[] {
    return this.weekConsultations.filter(c => {
      const d  = new Date(c.scheduledAt);
      const cH = String(d.getHours()).padStart(2, '0');
      return d.toDateString() === dayStr && cH === slotHour.split(':')[0];
    });
  }

  // ── Stats ──────────────────────────────────────────────
  get thisWeekCount(): number  { return this.weekConsultations.length; }
  get confirmedCount(): number { return this.weekConsultations.filter(c => c.status === 'UPCOMING').length; }
  get pendingCount(): number   { return this.weekConsultations.filter(c => c.status === 'PENDING_APPROVAL').length; }

  // ── Styles ─────────────────────────────────────────────
  aptBg(c: ConsultationResponse): string {
    if (c.priority === 'URGENT') return 'rgba(201,106,63,0.14)';
    const map: Record<string, string> = {
      IN_PERSON:  'rgba(122,158,126,0.14)',
      VIDEO_CALL: 'rgba(74,184,240,0.14)',
    };
    return map[c.consultationType] ?? 'rgba(201,106,63,0.14)';
  }

  aptBorderColor(c: ConsultationResponse): string {
    if (c.priority === 'URGENT') return '#c96a3f';
    const map: Record<string, string> = {
      IN_PERSON:  '#7a9e7e',
      VIDEO_CALL: '#4ab8f0',
    };
    return map[c.consultationType] ?? '#c96a3f';
  }

  typeIcon(t: string): string {
    const icons: Record<string, string> = { IN_PERSON: '🏥', VIDEO_CALL: '📹' };
    return icons[t] ?? '📋';
  }

  statusBadge(s: string): string {
    const map: Record<string, string> = {
      UPCOMING:        '✅',
      PENDING_APPROVAL:'⏳',
      COMPLETED:       '✔️',
      REJECTED:        '✖️',
      CANCELLED:       '🚫',
    };
    return map[s] ?? '•';
  }

  formatTime(dt: string): string {
    return new Date(dt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
}