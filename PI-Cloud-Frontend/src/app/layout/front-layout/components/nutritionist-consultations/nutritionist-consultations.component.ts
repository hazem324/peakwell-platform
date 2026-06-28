import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ConsultationResponse {
  id: number;
  scheduledAt: string;
  completedAt: string | null;
  createdAt: string;
  durationMinutes: number;
  status: string;
  doctorName: string;
  doctorSpecialty: string;
  consultationType: string;
  reason: string;
  priority: string;
  patientName: string;
  doctorNotes: string | null;
  diagnosis: string | null;
  prescription: string | null;
  followUpInstructions: string | null;
  followUpDate: string | null;
  biometricSnapshot: Record<string, any> | null;
  aiSummary: string | null;
  rating: Record<string, any> | null;
  patientImageUrl: string | null;
  rejectionReason: string | null;
}

@Component({
  selector: 'app-nutritionist-consultations',
  templateUrl: './nutritionist-consultations.component.html',
  styleUrls: ['./nutritionist-consultations.component.scss']
})
export class NutritionistConsultationsComponent implements OnInit {
  private apiBase = 'http://localhost:8090/peakwell/api/consultations';

  all: ConsultationResponse[] = [];
  loading = true;
  error = '';

  // Filters
  filterTab: 'all' | 'upcoming' | 'completed' | 'other' = 'all';
  filterText = '';

  // Pagination
  page = 1;
  pageSize = 9;

  // Drawer
  selected: ConsultationResponse | null = null;

  // Notes form
  notesLoading = false;
  notesSaved = false;
  formDiagnosis = '';
  formPrescription = '';
  formDoctorNotes = '';
  formFollowUpInstructions = '';
  formFollowUpDate = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<ConsultationResponse[]>(this.apiBase).subscribe({
      next: data => { this.all = data; this.loading = false; },
      error: () => { this.error = 'Failed to load consultations.'; this.loading = false; }
    });
  }

  // ── Filtering ──────────────────────────────────────
  get filtered(): ConsultationResponse[] {
    const txt = this.filterText.toLowerCase();
    return this.all.filter(c => {
      const matchTab =
        this.filterTab === 'all' ? true :
        this.filterTab === 'upcoming'  ? c.status === 'UPCOMING' :
        this.filterTab === 'completed' ? c.status === 'COMPLETED' :
        ['REJECTED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED', 'PENDING_APPROVAL'].includes(c.status);

      const matchText = !txt ||
        (c.patientName ?? '').toLowerCase().includes(txt) ||
        (c.reason ?? '').toLowerCase().includes(txt) ||
        (c.diagnosis ?? '').toLowerCase().includes(txt);

      return matchTab && matchText;
    }).sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
  }

  get paged(): ConsultationResponse[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filtered.length / this.pageSize);
  }

  pageRange(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  setTab(tab: typeof this.filterTab): void {
    this.filterTab = tab;
    this.page = 1;
  }

  // ── Counts ─────────────────────────────────────────
  get upcomingCount(): number  { return this.all.filter(c => c.status === 'UPCOMING').length; }
  get completedCount(): number { return this.all.filter(c => c.status === 'COMPLETED').length; }

  // ── Drawer ─────────────────────────────────────────
  openDrawer(c: ConsultationResponse): void {
    this.selected = c;
    this.notesSaved = false;
    this.formDiagnosis          = c.diagnosis ?? '';
    this.formPrescription       = c.prescription ?? '';
    this.formDoctorNotes        = c.doctorNotes ?? '';
    this.formFollowUpInstructions = c.followUpInstructions ?? '';
    this.formFollowUpDate       = c.followUpDate ? c.followUpDate.substring(0, 10) : '';
  }

  closeDrawer(): void { this.selected = null; }

  hasNotes(c: ConsultationResponse): boolean {
    return !!(c.diagnosis || c.prescription || c.doctorNotes);
  }

  // ── Save notes ─────────────────────────────────────
  saveNotes(): void {
    if (!this.selected) return;
    this.notesLoading = true;
    this.notesSaved = false;
    const body: any = {
      diagnosis: this.formDiagnosis || null,
      prescription: this.formPrescription || null,
      doctorNotes: this.formDoctorNotes || null,
      followUpInstructions: this.formFollowUpInstructions || null,
      followUpDate: this.formFollowUpDate ? this.formFollowUpDate + 'T00:00:00' : null,
    };
    this.http.patch<ConsultationResponse>(`${this.apiBase}/${this.selected.id}/notes`, body).subscribe({
      next: updated => {
        const idx = this.all.findIndex(c => c.id === updated.id);
        if (idx !== -1) this.all[idx] = updated;
        this.selected = updated;
        this.notesLoading = false;
        this.notesSaved = true;
      },
      error: () => { this.notesLoading = false; }
    });
  }

  // ── PDF generation ─────────────────────────────────
  downloadPdf(c: ConsultationResponse): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    let y = 0;

    // ── Header band ──────────────────────────────────
    doc.setFillColor(201, 106, 63);
    doc.rect(0, 0, W, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('PeakWell', 14, 13);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Consultation Summary Report', 14, 21);
    doc.setFontSize(9);
    doc.text(this.formatDate(c.scheduledAt), W - 14, 13, { align: 'right' });
    doc.text(`Ref #${c.id}`, W - 14, 21, { align: 'right' });
    y = 36;

    // ── Patient & Doctor info ────────────────────────
    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Patient Information', 14, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    y += 6;
    doc.text(`Name:`, 14, y);  doc.setFont('helvetica', 'bold'); doc.text(c.patientName || '—', 40, y); doc.setFont('helvetica', 'normal');
    y += 6;
    doc.text(`Doctor:`, 14, y); doc.setFont('helvetica', 'bold'); doc.text(c.doctorName || '—', 40, y); doc.setFont('helvetica', 'normal');
    y += 6;
    doc.text(`Specialty:`, 14, y); doc.text(c.doctorSpecialty || '—', 40, y);
    y += 10;

    // ── Appointment details table ────────────────────
    autoTable(doc, {
      startY: y,
      head: [['Date', 'Type', 'Duration', 'Priority', 'Status']],
      body: [[
        this.formatDate(c.scheduledAt),
        c.consultationType === 'IN_PERSON' ? 'In Person' : c.consultationType === 'VIDEO_CALL' ? 'Video Call' : (c.consultationType || '—'),
        c.durationMinutes ? `${c.durationMinutes} min` : '—',
        c.priority || '—',
        this.statusLabel(c.status)
      ]],
      headStyles: { fillColor: [122, 158, 126], textColor: 255, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
      theme: 'grid'
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    // ── Reason ───────────────────────────────────────
    if (c.reason) {
      y = this.addSection(doc, 'Reason for Consultation', c.reason, y, W);
    }

    // ── Diagnosis ────────────────────────────────────
    if (c.diagnosis) {
      y = this.addSection(doc, 'Diagnosis', c.diagnosis, y, W);
    }

    // ── Prescription ─────────────────────────────────
    if (c.prescription) {
      y = this.addSection(doc, 'Prescription', c.prescription, y, W);
    }

    // ── Doctor Notes ─────────────────────────────────
    if (c.doctorNotes) {
      y = this.addSection(doc, 'Clinical Notes', c.doctorNotes, y, W);
    }

    // ── Follow-up ────────────────────────────────────
    if (c.followUpInstructions || c.followUpDate) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 30, 30);
      doc.text('Follow-up', 14, y); y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      if (c.followUpDate) { doc.text(`Date: ${this.formatDate(c.followUpDate)}`, 14, y); y += 6; }
      if (c.followUpInstructions) {
        const lines = doc.splitTextToSize(c.followUpInstructions, W - 28);
        doc.text(lines, 14, y);
        y += lines.length * 5 + 8;
      }
    }

    // ── Biometrics ───────────────────────────────────
    if (c.biometricSnapshot && Object.keys(c.biometricSnapshot).length > 0) {
      const bm = c.biometricSnapshot;
      const rows: [string, string][] = [
        ['Weight', bm['weight'] != null ? `${bm['weight']} kg` : '—'],
        ['BMI', bm['bmi'] != null ? String(bm['bmi']) : '—'],
        ['Body Fat', bm['bodyFat'] != null ? `${bm['bodyFat']} %` : '—'],
        ['Blood Pressure', bm['systolic'] != null ? `${bm['systolic']}/${bm['diastolic']} mmHg` : '—'],
        ['Glucose', bm['glucose'] != null ? `${bm['glucose']} mg/dL` : '—'],
      ];
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
      doc.text('Biometric Snapshot', 14, y); y += 4;
      autoTable(doc, {
        startY: y,
        head: [['Metric', 'Value']],
        body: rows,
        headStyles: { fillColor: [90, 142, 196], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } },
        margin: { left: 14, right: 14 },
        theme: 'striped'
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    }

    // ── Footer ───────────────────────────────────────
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(180, 180, 180);
      doc.text('PeakWell Health Platform — Confidential Medical Document', 14, 290);
      doc.text(`Page ${i} of ${pages}`, W - 14, 290, { align: 'right' });
    }

    const patientSlug = (c.patientName || 'patient').replace(/\s+/g, '_');
    doc.save(`consultation_${patientSlug}_${c.id}.pdf`);
  }

  private addSection(doc: jsPDF, title: string, text: string, y: number, W: number): number {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.text(title, 14, y); y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(70, 70, 70);
    const lines = doc.splitTextToSize(text, W - 28);
    doc.text(lines, 14, y);
    y += lines.length * 5 + 8;
    return y;
  }

  // ── Helpers ────────────────────────────────────────
  formatDate(dt: string | null): string {
    if (!dt) return '—';
    try {
      return new Date(dt).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch { return dt; }
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      PENDING_APPROVAL: 'Pending', UPCOMING: 'Upcoming', COMPLETED: 'Completed',
      CANCELLED: 'Cancelled', REJECTED: 'Refused', RESCHEDULED: 'Rescheduled', NO_SHOW: 'No Show'
    };
    return map[status] ?? status;
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      UPCOMING: 'badge-blue', COMPLETED: 'badge-green', PENDING_APPROVAL: 'badge-yellow',
      CANCELLED: 'badge-red', REJECTED: 'badge-red', RESCHEDULED: 'badge-orange', NO_SHOW: 'badge-gray'
    };
    return map[status] ?? 'badge-gray';
  }

  avatarColor(name: string | null): string {
    const palette = ['#C9693F','#7A9E7E','#5B8DB8','#B0717A','#8B7BB0','#5F9EA0','#C47D3E','#7E9B6A'];
    if (!name) return '#C9693F';
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return palette[Math.abs(hash) % palette.length];
  }

  initials(name: string | null): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
  }
}