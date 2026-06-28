import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastServiceService } from '../../../../../services/toast-service.service';
import { DossierService } from '../../services/dossier.service';
import { BiometricResponse } from '../../services/api.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ConsultationResponse {
  id: number; scheduledAt: string; durationMinutes: number; status: string;
  doctorName: string; doctorSpecialty: string; consultationType: string;
  reason: string; priority: string;
  doctorNotes: string; diagnosis: string; prescription: string;
  followUpInstructions: string; followUpDate: string;
  biometricSnapshot: Record<string, any> | null;
  goalSnapshot: any[] | null;
  aiSummary: string | null;
  rating: Record<string, any> | null;
  rejectionReason: string | null;
  patientName: string; createdAt: string; completedAt: string;
}

interface ComparisonResult {
  earlier: any; later: any;
  metrics: { metric: string; unit: string; before: number; after: number; change: number; percentChange: number; trend: string }[];
  verdict: string; improved: number; worsened: number;
}

@Component({
  selector: 'app-consultations',
  templateUrl: './consultations.component.html',
  styleUrls: ['./consultations.component.scss']
})
export class ConsultationsComponent implements OnInit, OnDestroy {
  private apiBase       = 'http://localhost:8090/peakwell/api/consultations';
  private dietitianBase = 'http://localhost:8090/peakwell/dietitian';

  view: 'upcoming' | 'past' | 'select-dietitian' | 'book' | 'edit' | 'detail' | 'compare' | 'stats' | 'health-impact' = 'upcoming';
  editingConsult: ConsultationResponse | null = null;
  upcoming: ConsultationResponse[] = [];
  rejected: ConsultationResponse[] = [];
  past: ConsultationResponse[] = [];
  reminders: any[] = [];
  loading = true;
  selectedConsult: ConsultationResponse | null = null;
  private reminderInterval: any;

  // Dietitian selection
  dietitians: any[] = [];
  dietitiansLoading = false;
  selectedDietitian: any = null;

  // Book form
  doctorName = ''; doctorSpecialty = 'Nutritionist'; consultationType = 'IN_PERSON';
  scheduledAt = ''; durationMinutes = 30; reason = ''; priority = 'NORMAL';
  bookLoading = false;
  scheduledAtTouched = false;

  // Notes modal
  showNotesModal = false; notesConsultId: number | null = null;
  doctorNotes = ''; diagnosis = ''; prescription = ''; followUpInstructions = ''; followUpDate = '';

  // Rating modal
  showRatingModal = false; ratingConsultId: number | null = null;
  overallRating = 4; knowledgeRating = 4; communicationRating = 4;
  usefulnessRating = 4; punctualityRating = 4;
  wouldRecommend = true; feedback = ''; improvements = '';

  // Comparison
  compareId1: number | null = null; compareId2: number | null = null;
  comparisonResult: ComparisonResult | null = null; compareLoading = false;

  // Health Impact Timeline
  currentBiometrics: BiometricResponse | null = null;

  // AI Summary
  showAiSummary = false; aiSummaryText = '';

  // Search & Filter
  filterText = ''; filterSpecialty = ''; filterType = '';

  // Reschedule
  showRescheduleModal = false; rescheduleConsultId: number | null = null;
  rescheduleDate = ''; rescheduleLoading = false;

  // Change Dietitian
  showChangeDietitianModal = false; changeDietitianConsultId: number | null = null;
  changeDietitianLoading = false;

  // Edit Details
  showEditModal = false; editConsultId: number | null = null; editLoading = false;
  editReason = ''; editType = 'IN_PERSON'; editDuration = 30; editPriority = 'NORMAL';

  specialties = ['Nutritionist', 'General Physician', 'Cardiologist', 'Endocrinologist', 'Dietitian', 'Sports Medicine'];
  types = [
    { value: 'IN_PERSON', label: '🏥 In Person' },
    { value: 'VIDEO_CALL', label: '📹 Video Call' },
  ];
  priorities = [
    { value: 'LOW', label: 'Low', color: '#7a9e7e' },
    { value: 'NORMAL', label: 'Normal', color: '#4ab8f0' },
    { value: 'URGENT', label: 'Urgent', color: '#c96a3f' },
  ];
  durations = [15, 30, 45, 60, 90];

  constructor(
    private http: HttpClient,
    private toastService: ToastServiceService,
    private dossierService: DossierService
  ) {}

  ngOnInit(): void {
    this.loadAll();
    this.loadReminders();
    this.reminderInterval = setInterval(() => this.loadReminders(), 60000);
    this.dossierService.entries$.subscribe(entries => {
      this.currentBiometrics = entries.length ? entries[entries.length - 1] : null;
    });
    if (!this.dossierService.entries.length) {
      this.dossierService.loadBiometrics();
    }
  }

  ngOnDestroy(): void {
    if (this.reminderInterval) clearInterval(this.reminderInterval);
  }

  loadAll(): void {
    this.loading = true;
    this.http.get<ConsultationResponse[]>(`${this.apiBase}/upcoming`).subscribe({
      next: r => {
        this.upcoming = r.filter(c => c.status === 'UPCOMING' || c.status === 'SCHEDULED');
        const rejectedFuture = r.filter(c => c.status === 'REJECTED');
        this.rejected = [...rejectedFuture];
      }
    });
    this.http.get<ConsultationResponse[]>(`${this.apiBase}/past`).subscribe({
      next: r => {
        const rejectedPast = r.filter(c => c.status === 'REJECTED');
        // Merge with future rejected (avoid duplicates)
        this.rejected = [...this.rejected.filter(x => !rejectedPast.find(p => p.id === x.id)), ...rejectedPast];
        this.past = r.filter(c => c.status !== 'REJECTED');
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  loadReminders(): void {
    this.http.get<any[]>(`${this.apiBase}/reminders`).subscribe({
      next: r => { if (r.length > 0) { this.reminders = r; } },
      error: () => {}
    });
  }

  dismissReminder(i: number): void { this.reminders.splice(i, 1); }

  // ── Dietitian Selection ───────────────────────

  loadDietitians(): void {
    this.dietitiansLoading = true;
    this.http.get<any[]>(`${this.dietitianBase}/all`).subscribe({
      next: list => { this.dietitians = list; this.dietitiansLoading = false; },
      error: () => { this.dietitiansLoading = false; this.toastService.show('❌ Could not load dietitians'); }
    });
  }

  selectDietitian(d: any): void {
    this.selectedDietitian = d;
    this.doctorName = `${d.firstName ?? ''} ${d.lastName ?? ''}`.trim();
    this.doctorSpecialty = d.specialization || 'Dietitian';
    // Pre-fill scheduledAt to tomorrow at 09:00 so the form never defaults to midnight
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const pad = (n: number) => n.toString().padStart(2, '0');
    this.scheduledAt = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T09:00`;
    this.view = 'book';
  }

  openBooking(): void {
    this.selectedDietitian = null;
    this.view = 'select-dietitian';
    this.loadDietitians();
  }

  openRebook(c: ConsultationResponse): void {
    this.consultationType = c.consultationType || 'IN_PERSON';
    this.priority         = c.priority         || 'NORMAL';
    this.reason           = c.reason           || '';
    this.doctorName       = c.doctorName       || '';
    this.doctorSpecialty  = c.doctorSpecialty  || 'Nutritionist';
    this.scheduledAt      = '';
    this.selectedDietitian = null;
    this.dietitiansLoading = true;
    this.http.get<any[]>(`${this.dietitianBase}/all`).subscribe({
      next: list => {
        this.dietitians = list;
        this.dietitiansLoading = false;
        const match = list.find(d =>
          (`${d.firstName ?? ''} ${d.lastName ?? ''}`).trim().toLowerCase() === c.doctorName?.toLowerCase()
        );
        if (match) {
          this.selectedDietitian = match;
        }
        this.view = 'book';
      },
      error: () => { this.dietitiansLoading = false; this.view = 'book'; }
    });
  }

  roundRating(r: number | null): number { return r ? Math.round(r) : 0; }

  // ── Book ──────────────────────────────────────

  bookConsultation(): void {
    this.scheduledAtTouched = true;
    if (!this.doctorName || !this.scheduledAt) {
      this.toastService.show('⚠️ Fill in doctor name and date'); return;
    }
    if (new Date(this.scheduledAt) <= new Date()) {
      this.toastService.show('⚠️ Please select a future date and time'); return;
    }
    this.bookLoading = true;
    this.http.post<ConsultationResponse>(this.apiBase, {
      doctorName: this.doctorName, doctorSpecialty: this.doctorSpecialty,
      consultationType: this.consultationType, scheduledAt: this.scheduledAt,
      durationMinutes: this.durationMinutes, reason: this.reason, priority: this.priority,
      dietitianId: this.selectedDietitian?.id ?? null,
    }).subscribe({
      next: res => {
        this.bookLoading = false;
        this.view = 'upcoming';
        this.doctorName = ''; this.reason = ''; this.scheduledAt = '';
        this.scheduledAtTouched = false;

        if (res.status === 'REJECTED') {
          this.rejected.unshift(res);
          this.toastService.show('❌ Rendez-vous refusé automatiquement. Consultez votre email pour des créneaux alternatifs.');
        } else if (res.status === 'UPCOMING' || res.status === 'SCHEDULED') {
          this.upcoming.unshift(res);
          this.toastService.show('✅ Rendez-vous confirmé automatiquement !');
        } else {
          this.toastService.show('❌ Statut inattendu : ' + res.status);
        }
      },
      error: () => { this.bookLoading = false; this.toastService.show('❌ Booking failed'); }
    });
  }

  // ── Status ────────────────────────────────────

  markCompleted(id: number): void {
    this.http.patch<ConsultationResponse>(`${this.apiBase}/${id}/status`, { status: 'COMPLETED' }).subscribe({
      next: () => { this.loadAll(); this.toastService.show('✅ Completed'); },
    });
  }

  cancelConsult(id: number): void {
    this.http.delete(`${this.apiBase}/${id}`).subscribe({
      next: () => { this.loadAll(); this.toastService.show('🗑️ Cancelled'); },
    });
  }

  // ── Notes ─────────────────────────────────────

  openNotes(c: ConsultationResponse): void {
    this.notesConsultId = c.id;
    this.doctorNotes = c.doctorNotes || ''; this.diagnosis = c.diagnosis || '';
    this.prescription = c.prescription || ''; this.followUpInstructions = c.followUpInstructions || '';
    this.followUpDate = c.followUpDate ? c.followUpDate.substring(0, 16) : '';
    this.showNotesModal = true;
  }

  saveNotes(): void {
    if (!this.notesConsultId) return;
    this.http.patch<ConsultationResponse>(`${this.apiBase}/${this.notesConsultId}/notes`, {
      doctorNotes: this.doctorNotes, diagnosis: this.diagnosis,
      prescription: this.prescription, followUpInstructions: this.followUpInstructions,
      followUpDate: this.followUpDate || null,
    }).subscribe({
      next: () => { this.showNotesModal = false; this.loadAll(); this.toastService.show('✅ Notes saved'); },
    });
  }

  // ── Rating ────────────────────────────────────

  openRating(c: ConsultationResponse): void {
    this.ratingConsultId = c.id;
    if (c.rating) {
      this.overallRating = c.rating['overallRating'] || 4;
      this.knowledgeRating = c.rating['doctorKnowledgeRating'] || 4;
      this.communicationRating = c.rating['communicationRating'] || 4;
      this.usefulnessRating = c.rating['adviceUsefulnessRating'] || 4;
      this.punctualityRating = c.rating['punctualityRating'] || 4;
      this.wouldRecommend = c.rating['wouldRecommend'] !== false;
      this.feedback = c.rating['feedback'] || '';
      this.improvements = c.rating['improvements'] || '';
    } else {
      this.overallRating = 4; this.knowledgeRating = 4; this.communicationRating = 4;
      this.usefulnessRating = 4; this.punctualityRating = 4;
      this.wouldRecommend = true; this.feedback = ''; this.improvements = '';
    }
    this.showRatingModal = true;
  }

  saveRating(): void {
    if (!this.ratingConsultId) return;
    this.http.post<ConsultationResponse>(`${this.apiBase}/${this.ratingConsultId}/rating`, {
      overallRating: this.overallRating, doctorKnowledgeRating: this.knowledgeRating,
      communicationRating: this.communicationRating, adviceUsefulnessRating: this.usefulnessRating,
      punctualityRating: this.punctualityRating, wouldRecommend: this.wouldRecommend,
      feedback: this.feedback, improvements: this.improvements,
    }).subscribe({
      next: () => { this.showRatingModal = false; this.loadAll(); this.toastService.show('⭐ Rating saved!'); },
      error: () => this.toastService.show('❌ Failed to save rating')
    });
  }

  starArray(count: number): number[] { return Array(count).fill(0); }

  // ── AI Summary ────────────────────────────────

  viewAiSummary(c: ConsultationResponse): void {
    this.aiSummaryText = c.aiSummary || 'No AI summary available for this consultation.';
    this.showAiSummary = true;
  }

  // ── Comparison ────────────────────────────────

  openCompare(): void {
    this.view = 'compare';
    this.comparisonResult = null;
    this.compareId1 = this.past.length > 1 ? this.past[1].id : null;
    this.compareId2 = this.past.length > 0 ? this.past[0].id : null;
  }

  runComparison(): void {
    if (!this.compareId1 || !this.compareId2) {
      this.toastService.show('⚠️ Select two consultations'); return;
    }
    this.compareLoading = true;
    this.http.get<ComparisonResult>(`${this.apiBase}/compare?id1=${this.compareId1}&id2=${this.compareId2}`).subscribe({
      next: res => { this.comparisonResult = res; this.compareLoading = false; },
      error: () => { this.compareLoading = false; this.toastService.show('❌ Comparison failed'); }
    });
  }

  trendColor(trend: string): string {
    return trend === 'improved' ? '#7a9e7e' : trend === 'worsened' ? '#c96a3f' : '#8a7e78';
  }

  trendIcon(trend: string): string {
    return trend === 'improved' ? '📉' : trend === 'worsened' ? '📈' : '➡️';
  }

  // ── Detail ────────────────────────────────────

  openDetail(c: ConsultationResponse): void { this.selectedConsult = c; this.view = 'detail'; }

  // ── Reschedule ────────────────────────────────

  openReschedule(c: ConsultationResponse): void {
    this.rescheduleConsultId = c.id;
    this.rescheduleDate = c.scheduledAt ? c.scheduledAt.substring(0, 16) : '';
    this.showRescheduleModal = true;
  }

  rescheduleConsult(): void {
    if (!this.rescheduleConsultId || !this.rescheduleDate) {
      this.toastService.show('⚠️ Select a new date and time'); return;
    }
    this.rescheduleLoading = true;
    this.http.patch<ConsultationResponse>(`${this.apiBase}/${this.rescheduleConsultId}/reschedule`, {
      scheduledAt: this.rescheduleDate,
    }).subscribe({
      next: (res) => {
        this.showRescheduleModal = false; this.rescheduleLoading = false;
        this.loadAll();
        if (res.status === 'REJECTED') {
          this.toastService.show('❌ Nouveau créneau refusé automatiquement. Consultez votre email pour des alternatives.');
        } else if (res.status === 'UPCOMING') {
          this.toastService.show('✅ Rendez-vous reporté et confirmé automatiquement !');
        } else {
          this.toastService.show('📅 Rendez-vous reporté — en attente de confirmation du nutritionniste.');
        }
      },
      error: () => { this.rescheduleLoading = false; this.toastService.show('❌ Reschedule failed'); }
    });
  }

  // ── Change Dietitian ──────────────────────────

  openChangeDietitian(c: ConsultationResponse): void {
    this.changeDietitianConsultId = c.id;
    this.showChangeDietitianModal = true;
    this.selectedDietitian = null;
    this.loadDietitians();
  }

  // ── Edit Details (full view) ──────────────────

  openEditDetails(c: ConsultationResponse): void {
    this.editingConsult = c;
    this.editConsultId = c.id;
    this.editReason = c.reason || '';
    this.editType = c.consultationType || 'IN_PERSON';
    this.editDuration = c.durationMinutes || 30;
    this.editPriority = c.priority || 'NORMAL';
    this.scheduledAt = c.scheduledAt ? c.scheduledAt.substring(0, 16) : '';
    this.doctorName = c.doctorName || '';
    this.doctorSpecialty = c.doctorSpecialty || 'Nutritionist';
    this.selectedDietitian = null;
    this.view = 'edit';
    this.loadDietitians();
  }

  selectDietitianForEdit(d: any): void {
    this.selectedDietitian = d;
    this.doctorName = `${d.firstName ?? ''} ${d.lastName ?? ''}`.trim();
    this.doctorSpecialty = d.specialization || 'Dietitian';
  }

  saveEditDetails(): void {
    if (!this.editConsultId || !this.scheduledAt) {
      this.toastService.show('⚠️ Please fill in the date and time'); return;
    }
    this.editLoading = true;
    this.http.patch<ConsultationResponse>(`${this.apiBase}/${this.editConsultId}/details`, {
      reason: this.editReason,
      consultationType: this.editType,
      durationMinutes: this.editDuration,
      priority: this.editPriority,
      doctorName: this.doctorName,
      doctorSpecialty: this.doctorSpecialty,
      scheduledAt: this.scheduledAt,
    }).subscribe({
      next: () => {
        this.editLoading = false;
        this.editingConsult = null;
        this.view = 'upcoming';
        this.loadAll();
        this.toastService.show('✅ Appointment updated successfully');
      },
      error: () => { this.editLoading = false; this.toastService.show('❌ Failed to save changes'); }
    });
  }


  confirmChangeDietitian(d: any): void {
    if (!this.changeDietitianConsultId) return;
    this.changeDietitianLoading = true;
    const name = `${d.firstName ?? ''} ${d.lastName ?? ''}`.trim();
    const specialty = d.specialization || 'Dietitian';
    this.http.patch<ConsultationResponse>(`${this.apiBase}/${this.changeDietitianConsultId}/doctor`, {
      doctorName: name, doctorSpecialty: specialty,
    }).subscribe({
      next: updated => {
        const idx = this.upcoming.findIndex(c => c.id === this.changeDietitianConsultId);
        if (idx !== -1) this.upcoming[idx] = updated;
        this.showChangeDietitianModal = false;
        this.changeDietitianLoading = false;
        this.toastService.show('✅ Dietitian changed to ' + name);
      },
      error: () => { this.changeDietitianLoading = false; this.toastService.show('❌ Failed to change dietitian'); }
    });
  }

  // ── Search & Filter ───────────────────────────

  get filteredPast(): ConsultationResponse[] {
    return this.past.filter(c => {
      const q = this.filterText.toLowerCase();
      const textMatch = !q || c.doctorName.toLowerCase().includes(q)
        || (c.diagnosis || '').toLowerCase().includes(q)
        || (c.reason || '').toLowerCase().includes(q);
      const specialtyMatch = !this.filterSpecialty || c.doctorSpecialty === this.filterSpecialty;
      const typeMatch = !this.filterType || c.consultationType === this.filterType;
      return textMatch && specialtyMatch && typeMatch;
    });
  }

  clearFilters(): void { this.filterText = ''; this.filterSpecialty = ''; this.filterType = ''; }
  get hasActiveFilters(): boolean { return !!(this.filterText || this.filterSpecialty || this.filterType); }

  // ── Statistics ────────────────────────────────

  get minDateTime(): string {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  }

  get scheduledAtError(): string | null {
    if (!this.scheduledAt) return 'Date and time is required.';
    if (new Date(this.scheduledAt) <= new Date()) return 'Please select a future date and time.';
    return null;
  }

  get totalConsultations(): number { return this.past.length + this.upcoming.length + this.rejected.length; }
  get completedCount(): number { return this.past.filter(c => c.status === 'COMPLETED').length; }
  get ratedCount(): number { return this.past.filter(c => c.rating?.['overallRating']).length; }

  get avgRating(): number {
    const rated = this.past.filter(c => c.rating?.['overallRating']);
    if (!rated.length) return 0;
    return Math.round(rated.reduce((s, c) => s + c.rating!['overallRating'], 0) / rated.length * 10) / 10;
  }

  get specialtyBreakdown(): { name: string; count: number; pct: number }[] {
    const all = [...this.past, ...this.upcoming];
    if (!all.length) return [];
    const counts: Record<string, number> = {};
    all.forEach(c => counts[c.doctorSpecialty] = (counts[c.doctorSpecialty] || 0) + 1);
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count, pct: Math.round(count / all.length * 100) }))
      .sort((a, b) => b.count - a.count);
  }

  get typeBreakdown(): { label: string; count: number; pct: number; color: string }[] {
    const all = [...this.past, ...this.upcoming];
    if (!all.length) return [];
    const colorMap: Record<string, string> = { IN_PERSON: '#7a9e7e', VIDEO_CALL: '#4ab8f0', PHONE: '#a47cf0' };
    const labelMap: Record<string, string> = { IN_PERSON: '🏥 In Person', VIDEO_CALL: '📹 Video Call', PHONE: '📞 Phone' };
    const counts: Record<string, number> = {};
    all.forEach(c => counts[c.consultationType] = (counts[c.consultationType] || 0) + 1);
    return Object.entries(counts)
      .map(([type, count]) => ({ label: labelMap[type] || type, count, pct: Math.round(count / all.length * 100), color: colorMap[type] || '#b5aaa5' }))
      .sort((a, b) => b.count - a.count);
  }

  get monthlyTrend(): { month: string; count: number }[] {
    const all = [...this.past, ...this.upcoming];
    const months: Record<string, number> = {};
    all.forEach(c => {
      const d = new Date(c.scheduledAt);
      const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      months[key] = (months[key] || 0) + 1;
    });
    return Object.entries(months).slice(-6).map(([month, count]) => ({ month, count }));
  }

  get maxMonthlyCount(): number {
    const trend = this.monthlyTrend;
    return trend.length ? Math.max(...trend.map(m => m.count)) : 1;
  }

  // ── Health Impact Timeline ────────────────────

  private parseSnapshot(raw: Record<string, any> | string | null): Record<string, any> | null {
    if (!raw) return null;
    if (typeof raw === 'string') {
      try { return JSON.parse(raw); } catch { return null; }
    }
    return raw;
  }

  get impactTimeline(): {
    consultation: ConsultationResponse;
    snap: Record<string, any> | null;
    delta: { weight: number | null; bmi: number | null; systolic: number | null; glucose: number | null } | null;
  }[] {
    const sorted = [...this.past]
      .filter(c => c.biometricSnapshot)
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

    return sorted.map((c, i) => {
      const snap = this.parseSnapshot(c.biometricSnapshot);
      const prevSnap = i > 0 ? this.parseSnapshot(sorted[i - 1].biometricSnapshot) : null;

      const delta = prevSnap && snap ? {
        weight:   snap['weight']   != null && prevSnap['weight']   != null ? Math.round((snap['weight']   - prevSnap['weight'])   * 10) / 10 : null,
        bmi:      snap['bmi']      != null && prevSnap['bmi']      != null ? Math.round((snap['bmi']      - prevSnap['bmi'])      * 10) / 10 : null,
        systolic: snap['systolic'] != null && prevSnap['systolic'] != null ? Math.round(snap['systolic']  - prevSnap['systolic'])          : null,
        glucose:  snap['glucose']  != null && prevSnap['glucose']  != null ? Math.round(snap['glucose']   - prevSnap['glucose'])           : null,
      } : null;

      return { consultation: c, snap, delta };
    });
  }

  get impactSummary(): { label: string; delta: number | null; unit: string; improved: boolean | null }[] {
    const nodes = this.impactTimeline;
    if (nodes.length < 2) return [];
    const first = nodes[0].snap;
    const last  = nodes[nodes.length - 1].snap;
    if (!first || !last) return [];

    const diff = (key: string, decimals = 1) => {
      if (first[key] == null || last[key] == null) return null;
      return Math.round((last[key] - first[key]) * Math.pow(10, decimals)) / Math.pow(10, decimals);
    };

    return [
      { label: 'Weight',   delta: diff('weight'),   unit: 'kg',    improved: diff('weight')   !== null ? diff('weight')!   < 0 : null },
      { label: 'BMI',      delta: diff('bmi'),       unit: '',      improved: diff('bmi')      !== null ? diff('bmi')!      < 0 : null },
      { label: 'Systolic', delta: diff('systolic', 0), unit: 'mmHg', improved: diff('systolic', 0) !== null ? diff('systolic', 0)! < 0 : null },
      { label: 'Glucose',  delta: diff('glucose',  0), unit: 'mg/dL', improved: diff('glucose',  0) !== null ? diff('glucose',  0)! < 0 : null },
    ].filter(s => s.delta !== null);
  }

  deltaColor(val: number | null, lowerIsBetter = true): string {
    if (val == null || val === 0) return '#8a7e78';
    const improved = lowerIsBetter ? val < 0 : val > 0;
    return improved ? '#7a9e7e' : '#c96a3f';
  }

  deltaIcon(val: number | null, lowerIsBetter = true): string {
    if (val == null || val === 0) return '→';
    const improved = lowerIsBetter ? val < 0 : val > 0;
    return improved ? '↓' : '↑';
  }

  openHealthImpact(): void {
    this.view = 'health-impact';
  }

  // ── Helpers ───────────────────────────────────

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }
  formatTime(d: string): string { return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }); }
  priorityColor(p: string): string { return this.priorities.find(x => x.value === p)?.color ?? '#8a7e78'; }
  statusColor(s: string): string {
    const m: Record<string, string> = {
      PENDING_APPROVAL: '#f0a84a',
      UPCOMING: '#4ab8f0',
      IN_PROGRESS: '#e88f68',
      COMPLETED: '#7a9e7e',
      CANCELLED: '#b5aaa5',
      REJECTED: '#c96a3f'
    };
    return m[s] ?? '#8a7e78';
  }

  statusLabel(s: string): string {
    const m: Record<string, string> = {
      PENDING_APPROVAL: 'Pending Approval',
      UPCOMING: 'Upcoming',
      IN_PROGRESS: 'In Progress',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
      REJECTED: 'Rejected'
    };
    return m[s] ?? s;
  }
  downloadPdf(c: ConsultationResponse): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    const orange = '#c96a3f';

    // Header bar
    doc.setFillColor(orange);
    doc.rect(0, 0, W, 22, 'F');
    doc.setTextColor('#ffffff');
    doc.setFontSize(14); doc.setFont('helvetica', 'bold');
    doc.text('Consultation Report', 14, 14);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text(`PeakWell — ${this.formatDate(c.scheduledAt)}`, W - 14, 14, { align: 'right' });

    // Info table
    doc.setTextColor('#1e1a16');
    autoTable(doc, {
      startY: 28,
      head: [['Field', 'Value']],
      body: [
        ['Doctor',   c.doctorName || '—'],
        ['Specialty',c.doctorSpecialty || '—'],
        ['Date',     this.formatDate(c.scheduledAt)],
        ['Type',     (c.consultationType || '').replace('_', ' ')],
        ['Duration', `${c.durationMinutes} min`],
        ['Status',   c.status],
      ],
      theme: 'grid',
      headStyles: { fillColor: orange, textColor: '#fff', fontStyle: 'bold' },
      styles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35 } },
    });

    let y: number = (doc as any).lastAutoTable.finalY + 8;

    const addSection = (title: string, text: string) => {
      if (!text) return;
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(orange);
      doc.text(title, 14, y); y += 6;
      doc.setFont('helvetica', 'normal'); doc.setTextColor('#2d2d2d'); doc.setFontSize(9);
      const lines = doc.splitTextToSize(text, W - 28);
      doc.text(lines, 14, y); y += lines.length * 5 + 6;
    };

    addSection('Diagnosis',            c.diagnosis || '');
    addSection('Prescription',         c.prescription || '');
    addSection('Doctor Notes',         c.doctorNotes || '');
    addSection('Follow-up Instructions', c.followUpInstructions || '');

    // Biometrics
    if (c.biometricSnapshot && Object.keys(c.biometricSnapshot).length) {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(orange);
      doc.text('Biometric Snapshot', 14, y); y += 4;
      const bRows = Object.entries(c.biometricSnapshot)
        .filter(([, v]) => v != null)
        .map(([k, v]) => [k.replace(/([A-Z])/g, ' $1').trim(), String(v)]);
      autoTable(doc, {
        startY: y, body: bRows, theme: 'striped',
        styles: { fontSize: 9 }, columnStyles: { 0: { fontStyle: 'bold' } },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }

    // Footer
    doc.setFontSize(8); doc.setTextColor('#a0aec0');
    doc.text('Generated by PeakWell', 14, 287);
    doc.text(`Page 1`, W - 14, 287, { align: 'right' });

    doc.save(`consultation-${c.id}-${c.doctorName?.replace(/\s+/g, '-')}.pdf`);
  }

  typeIcon(t: string): string {
    const m: Record<string, string> = { IN_PERSON: '🏥', VIDEO_CALL: '📹', PHONE: '📞' };
    return m[t] ?? '📋';
  }
}