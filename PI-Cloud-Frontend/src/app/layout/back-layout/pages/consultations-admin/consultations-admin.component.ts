import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface ConsultationResponse {
  id: number;
  scheduledAt: string;
  durationMinutes: number;
  status: string;
  doctorName: string;
  doctorSpecialty: string;
  consultationType: string;
  reason: string;
  priority: string;
  doctorNotes: string;
  diagnosis: string;
  prescription: string;
  patientName: string;
  rating: Record<string, any> | null;
  rejectionReason: string | null;
  createdAt: string;
  completedAt: string;
}


interface Nutritionist {
  name: string;
  specialty: string;
  total: number;
  pending: number;
  upcoming: number;
  completed: number;
}

@Component({
  selector: 'app-consultations-admin',
  templateUrl: './consultations-admin.component.html',
  styleUrls: ['./consultations-admin.component.scss']
})
export class ConsultationsAdminComponent implements OnInit {
  private apiBase = 'http://localhost:8090/peakwell/api/consultations/admin/all';

  all: ConsultationResponse[] = [];
  loading = true;
  error = '';

  // Nutritionist selection
  selectedNutritionist: Nutritionist | null = null;
  nutriSearch = '';
  nutriPage = 1;
  nutriPageSize = 6;

  // Consultation list pagination
  consultPage = 1;
  consultPageSize = 9;

  filterText = '';
  filterStatus = '';
  filterType = '';
  sortField: keyof ConsultationResponse = 'doctorName';
  sortAsc = true;

  selectedConsult: ConsultationResponse | null = null;
  showRejectModal = false;
  rejectReason = '';
  rejectTargetId: number | null = null;
  actionLoading = false;

  // ── Slot suggestions ──────────────────────────────
  availableSlots: string[] = [];
  selectedSlots: string[] = [];
  slotsLoading = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<ConsultationResponse[]>(this.apiBase).subscribe({
      next: data => { this.all = data; this.loading = false; },
      error: () => { this.error = 'Failed to load consultations.'; this.loading = false; }
    });
  }

  get nutritionists(): Nutritionist[] {
    const map = new Map<string, Nutritionist>();
    for (const c of this.all) {
      const name = c.doctorName || 'Unknown';
      if (!map.has(name)) {
        map.set(name, { name, specialty: c.doctorSpecialty || 'Nutrition', total: 0, pending: 0, upcoming: 0, completed: 0 });
      }
      const n = map.get(name)!;
      n.total++;
      if (c.status === 'PENDING_APPROVAL') n.pending++;
      if (c.status === 'UPCOMING') n.upcoming++;
      if (c.status === 'COMPLETED') n.completed++;
    }
    return [...map.values()].sort((a, b) => b.total - a.total);
  }

  get filteredNutritionists(): Nutritionist[] {
    const q = this.nutriSearch.toLowerCase();
    return this.nutritionists.filter(n =>
      !q || n.name.toLowerCase().includes(q) || n.specialty.toLowerCase().includes(q)
    );
  }

  get pagedNutritionists(): Nutritionist[] {
    const start = (this.nutriPage - 1) * this.nutriPageSize;
    return this.filteredNutritionists.slice(start, start + this.nutriPageSize);
  }

  get nutriTotalPages(): number {
    return Math.ceil(this.filteredNutritionists.length / this.nutriPageSize);
  }

  nutriPageRange(): number[] {
    return Array.from({ length: this.nutriTotalPages }, (_, i) => i + 1);
  }

  get pagedConsults(): ConsultationResponse[] {
    const start = (this.consultPage - 1) * this.consultPageSize;
    return this.filtered.slice(start, start + this.consultPageSize);
  }

  get consultTotalPages(): number {
    return Math.ceil(this.filtered.length / this.consultPageSize);
  }

  consultPageRange(): number[] {
    return Array.from({ length: this.consultTotalPages }, (_, i) => i + 1);
  }

  selectNutritionist(n: Nutritionist): void {
    this.selectedNutritionist = n;
    this.consultPage = 1;
    this.clearFilters();
  }

  backToNutritionists(): void {
    this.selectedNutritionist = null;
    this.selectedConsult = null;
    this.clearFilters();
  }

  get filtered(): ConsultationResponse[] {
    const txt  = this.filterText.toLowerCase();
    const now  = new Date();
    let list = this.all.filter(c => {
      const matchNutritionist = !this.selectedNutritionist || c.doctorName === this.selectedNutritionist.name;
      const matchText = !txt ||
        (c.patientName ?? '').toLowerCase().includes(txt) ||
        (c.doctorName ?? '').toLowerCase().includes(txt) ||
        (c.reason ?? '').toLowerCase().includes(txt) ||
        (c.doctorSpecialty ?? '').toLowerCase().includes(txt);
      const matchStatus = !this.filterStatus
        ? true
        : this.filterStatus === 'PAST'
          ? c.scheduledAt != null && new Date(c.scheduledAt) < now
          : c.status === this.filterStatus;
      const matchType = !this.filterType || c.consultationType === this.filterType;
      return matchNutritionist && matchText && matchStatus && matchType;
    });

    list = list.slice().sort((a, b) => {
      const av = a[this.sortField] as any ?? '';
      const bv = b[this.sortField] as any ?? '';
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return this.sortAsc ? cmp : -cmp;
    });

    return list;
  }

  get uniqueStatuses(): string[] {
    return [...new Set(this.all.map(c => c.status).filter(Boolean))];
  }

  get uniqueTypes(): string[] {
    return [...new Set(this.all.map(c => c.consultationType).filter(Boolean))];
  }

  sort(field: keyof ConsultationResponse): void {
    if (this.sortField === field) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortField = field;
      this.sortAsc = true;
    }
  }

  sortIcon(field: keyof ConsultationResponse): string {
    if (this.sortField !== field) return '⇅';
    return this.sortAsc ? '↑' : '↓';
  }

  openDetail(c: ConsultationResponse): void {
    this.selectedConsult = c;
  }

  closeDetail(): void {
    this.selectedConsult = null;
  }

  get pendingCount(): number {
    return this.all.filter(c => c.status === 'PENDING_APPROVAL').length;
  }

  private readonly consultBase = 'http://localhost:8090/peakwell/api/consultations';

  confirm(id: number): void {
    this.actionLoading = true;
    this.http.patch<ConsultationResponse>(`${this.consultBase}/${id}/confirm`, {}).subscribe({
      next: updated => {
        this.replaceInList(updated);
        if (this.selectedConsult?.id === id) this.selectedConsult = updated;
        this.actionLoading = false;
      },
      error: () => this.actionLoading = false
    });
  }

  openRejectModal(id: number): void {
    this.rejectTargetId = id;
    this.rejectReason   = '';
    this.selectedSlots  = [];
    this.availableSlots = [];
    this.showRejectModal = true;

    // Load available slots for the dietitian
    this.slotsLoading = true;
    this.http.get<string[]>(`${this.consultBase}/${id}/available-slots`).subscribe({
      next: slots => { this.availableSlots = slots; this.slotsLoading = false; },
      error: ()    => { this.slotsLoading = false; }
    });
  }

  toggleSlot(slot: string): void {
    const idx = this.selectedSlots.indexOf(slot);
    if (idx >= 0) {
      this.selectedSlots.splice(idx, 1);
    } else if (this.selectedSlots.length < 3) {
      this.selectedSlots.push(slot);
    }
  }

  isSlotSelected(slot: string): boolean { return this.selectedSlots.includes(slot); }

  formatSlotLabel(iso: string): string {
    try {
      return new Date(iso).toLocaleString('fr-FR', {
        weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
      });
    } catch { return iso; }
  }

  confirmReject(): void {
    if (!this.rejectTargetId) return;
    this.actionLoading = true;
    const body: any = { reason: this.rejectReason };
    if (this.selectedSlots.length > 0) body.suggestedSlots = this.selectedSlots;

    this.http.patch<ConsultationResponse>(`${this.consultBase}/${this.rejectTargetId}/reject`, body).subscribe({
      next: updated => {
        this.replaceInList(updated);
        this.selectedConsult = updated;
        this.showRejectModal = false;
        this.actionLoading = false;
      },
      error: () => this.actionLoading = false
    });
  }

  private replaceInList(updated: ConsultationResponse): void {
    const idx = this.all.findIndex(c => c.id === updated.id);
    if (idx !== -1) this.all[idx] = updated;
  }

  formatDate(dt: string | null): string {
    if (!dt) return '—';
    try {
      return new Date(dt).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch { return dt; }
  }

  statusIcon(status: string): string {
    const map: Record<string, string> = {
      UPCOMING:         '✓',
      SCHEDULED:        '✓',
      COMPLETED:        '✓',
      REJECTED:         '—',
      CANCELLED:        '—',
      PENDING_APPROVAL: '·',
      RESCHEDULED:      '↻',
      NO_SHOW:          '?',
    };
    return map[status] ?? '·';
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      PENDING_APPROVAL: 'Pending',
      UPCOMING:         'Accepted',
      SCHEDULED:        'Accepted',
      COMPLETED:        'Completed',
      CANCELLED:        'Cancelled',
      REJECTED:         'Refused',
      RESCHEDULED:      'Rescheduled',
      NO_SHOW:          'No Show'
    };
    return map[status] ?? status;
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      PENDING_APPROVAL: 'badge-pending',
      UPCOMING: 'badge-blue',
      SCHEDULED: 'badge-blue',
      COMPLETED: 'badge-green',
      CANCELLED: 'badge-red',
      REJECTED: 'badge-red',
      RESCHEDULED: 'badge-orange',
      NO_SHOW: 'badge-gray'
    };
    return map[status] ?? 'badge-gray';
  }

  priorityClass(priority: string): string {
    const map: Record<string, string> = {
      URGENT: 'pri-urgent',
      HIGH: 'pri-high',
      NORMAL: 'pri-normal',
      LOW: 'pri-low'
    };
    return map[priority] ?? 'pri-normal';
  }

  avgRating(c: ConsultationResponse): string {
    if (!c.rating) return '—';
    const keys = ['overall', 'knowledge', 'communication', 'usefulness', 'punctuality'];
    const vals = keys.map(k => Number(c.rating![k])).filter(v => !isNaN(v) && v > 0);
    if (!vals.length) return '—';
    return (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1);
  }

  clearFilters(): void {
    this.filterText = '';
    this.filterStatus = '';
    this.filterType = '';
    this.consultPage = 1;
  }

  get hasFilters(): boolean {
    return !!(this.filterText || this.filterStatus || this.filterType);
  }

  private readonly avatarPalette = [
    '#fde8d8', '#e8f0dd', '#fff3e0', '#fce4ec',
    '#e8eaf6', '#f9fbe7', '#e0f7fa', '#fbe9e7',
  ];

  avatarColor(name: string | null): string {
    if (!name) return '#f0ebe6';
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return this.avatarPalette[Math.abs(hash) % this.avatarPalette.length];
  }

  initials(name: string | null): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
  }
}