import { Component, Input, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface NoteDto {
  id: number;
  clientId: number;
  date: string;
  nutritionist: string;
  type: string;
  summary: string;
  recommendations: string[];
  nextAppointment: string;
}

@Component({
  selector: 'app-consultation-notes',
  templateUrl: './consultation-notes.component.html',
  styleUrls: ['./consultation-notes.component.scss']
})
export class ConsultationNotesComponent implements OnInit {
  @Input() clientId!: number;

  private apiBase = 'http://localhost:8090/peakwell/api/admin/consultation-notes';

  notes: NoteDto[] = [];
  expanded: number | null = null;
  loading = false;

  // Form state
  showForm = false;
  editingId: number | null = null;
  saving = false;

  formType = 'Follow-up';
  formNutritionist = '';
  formDate = '';
  formSummary = '';
  formRecommendations = '';   // newline-separated
  formNextAppointment = '';

  noteTypes = ['Initial Consultation', 'Follow-up', 'Progress Review', 'Urgent Review'];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.http.get<NoteDto[]>(`${this.apiBase}?clientId=${this.clientId}`).subscribe({
      next: notes => { this.notes = notes; this.loading = false; },
      error: () => this.loading = false,
    });
  }

  toggle(id: number): void {
    this.expanded = this.expanded === id ? null : id;
  }

  openAddForm(): void {
    this.editingId = null;
    this.formType = 'Follow-up';
    this.formNutritionist = '';
    this.formDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    this.formSummary = '';
    this.formRecommendations = '';
    this.formNextAppointment = '';
    this.showForm = true;
  }

  openEditForm(note: NoteDto): void {
    this.editingId = note.id;
    this.formType = note.type;
    this.formNutritionist = note.nutritionist;
    this.formDate = note.date;
    this.formSummary = note.summary;
    this.formRecommendations = (note.recommendations || []).join('\n');
    this.formNextAppointment = note.nextAppointment;
    this.showForm = true;
    this.expanded = null;
  }

  saveForm(): void {
    if (!this.formSummary.trim()) return;
    const recommendations = this.formRecommendations.split('\n').map(r => r.trim()).filter(r => r);
    const payload = {
      clientId: this.clientId,
      date: this.formDate,
      nutritionist: this.formNutritionist,
      type: this.formType,
      summary: this.formSummary,
      recommendations,
      nextAppointment: this.formNextAppointment,
    };
    this.saving = true;
    if (this.editingId !== null) {
      this.http.put<NoteDto>(`${this.apiBase}/${this.editingId}`, payload).subscribe({
        next: () => { this.load(); this.cancelForm(); },
        error: () => this.saving = false,
      });
    } else {
      this.http.post<NoteDto>(this.apiBase, payload).subscribe({
        next: () => { this.load(); this.cancelForm(); },
        error: () => this.saving = false,
      });
    }
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingId = null;
    this.saving = false;
  }

  deleteNote(id: number): void {
    if (!confirm('Delete this consultation note?')) return;
    this.http.delete(`${this.apiBase}/${id}`).subscribe({
      next: () => {
        this.notes = this.notes.filter(n => n.id !== id);
        if (this.expanded === id) this.expanded = null;
      },
    });
  }

  typeColor(type: string): string {
    const map: Record<string, string> = {
      'Initial Consultation': '#7a9e7e',
      'Follow-up':            '#c96a3f',
      'Progress Review':      '#a47cf0',
      'Urgent Review':        '#e88f68',
    };
    return map[type] ?? '#b5aaa5';
  }
}
