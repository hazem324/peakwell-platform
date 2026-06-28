import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastServiceService } from '../../../../../services/toast-service.service';

interface SymptomEntry {
  id: number; logDate: string; symptom: string; severity: number;
  timeOfDay: string; duration: number | null; notes: string;
  mood: number; energyLevel: number; stressLevel: number;
  tags: string[]; triggers: string[]; createdAt: string;
}

interface SymptomFrequency {
  symptom: string; count: number; avgSeverity: number; mostCommonTime: string;
}

interface Correlation {
  symptom: string; biometric: string; relationship: string;
  strength: number; description: string;
}

interface PatternInsight {
  type: string; icon: string; title: string; description: string; severity: string;
}

interface OverallSummary {
  totalEntries: number; uniqueSymptoms: number; correlationsFound: number;
  avgMood: number; avgEnergy: number; avgStress: number;
  mostFrequentSymptom: string; peakSymptomTime: string;
}

interface CorrelationResponse {
  topSymptoms: SymptomFrequency[];
  correlations: Correlation[];
  patterns: PatternInsight[];
  summary: OverallSummary;
}

@Component({
  selector: 'app-symptom-journal',
  templateUrl: './symptom-journal.component.html',
  styleUrls: ['./symptom-journal.component.scss']
})
export class SymptomJournalComponent implements OnInit {
  private apiBase = 'http://localhost:8090/peakwell/api/symptoms';

  activeView: 'log' | 'history' | 'insights' = 'log';
  entries: SymptomEntry[] = [];
  analysis: CorrelationResponse | null = null;
  loadingAnalysis = false;
  saving = false;

  // Log form
  form = {
    logDate: new Date().toISOString().split('T')[0],
    symptom: '',
    customSymptom: '',
    severity: 3,
    timeOfDay: '',
    duration: null as number | null,
    notes: '',
    mood: 3,
    energyLevel: 3,
    stressLevel: 3,
    tags: [] as string[],
    triggers: [] as string[],
  };

  newTag = '';
  newTrigger = '';

  commonSymptoms = [
    'Headache', 'Fatigue', 'Nausea', 'Dizziness', 'Insomnia',
    'Bloating', 'Joint Pain', 'Muscle Pain', 'Anxiety', 'Brain Fog',
    'Chest Tightness', 'Shortness of Breath', 'Back Pain', 'Stomach Pain',
    'Heartburn', 'Cramps', 'Numbness', 'Skin Rash', 'Other'
  ];

  timesOfDay = [
    { value: 'morning',   label: '🌅 Morning' },
    { value: 'afternoon', label: '☀️ Afternoon' },
    { value: 'evening',   label: '🌇 Evening' },
    { value: 'night',     label: '🌙 Night' },
  ];

  commonTriggers = [
    'Caffeine', 'Poor sleep', 'Skipped meal', 'Stress', 'Alcohol',
    'Exercise', 'Dehydration', 'Weather change', 'Screen time', 'Medication'
  ];

  // History filters
  historyFilter = 'all';
  distinctSymptoms: string[] = [];

  constructor(
    private http: HttpClient,
    private toastService: ToastServiceService
  ) {}

  ngOnInit(): void {
    this.loadEntries();
    this.loadDistinctSymptoms();
  }

  // ── Data Loading ──────────────────────────────

  loadEntries(): void {
    this.http.get<SymptomEntry[]>(this.apiBase).subscribe({
      next: entries => this.entries = entries,
      error: () => this.toastService.show('❌ Failed to load symptoms')
    });
  }

  loadDistinctSymptoms(): void {
    this.http.get<string[]>(`${this.apiBase}/types`).subscribe({
      next: types => this.distinctSymptoms = types,
      error: () => {}
    });
  }

  loadAnalysis(): void {
    this.loadingAnalysis = true;
    this.http.get<CorrelationResponse>(`${this.apiBase}/correlations`).subscribe({
      next: res => { this.analysis = res; this.loadingAnalysis = false; },
      error: () => { this.toastService.show('❌ Analysis failed'); this.loadingAnalysis = false; }
    });
  }

  // ── Log Form ──────────────────────────────────

  get effectiveSymptom(): string {
    return this.form.symptom === 'Other' ? this.form.customSymptom : this.form.symptom;
  }

  selectSymptom(symptom: string): void {
    this.form.symptom = symptom;
    if (symptom !== 'Other') this.form.customSymptom = '';
  }

  selectTime(time: string): void {
    this.form.timeOfDay = this.form.timeOfDay === time ? '' : time;
  }

  addTag(): void {
    if (this.newTag.trim() && !this.form.tags.includes(this.newTag.trim())) {
      this.form.tags.push(this.newTag.trim());
      this.newTag = '';
    }
  }

  removeTag(index: number): void { this.form.tags.splice(index, 1); }

  toggleTrigger(trigger: string): void {
    const idx = this.form.triggers.indexOf(trigger);
    if (idx >= 0) this.form.triggers.splice(idx, 1);
    else this.form.triggers.push(trigger);
  }

  addCustomTrigger(): void {
    if (this.newTrigger.trim() && !this.form.triggers.includes(this.newTrigger.trim())) {
      this.form.triggers.push(this.newTrigger.trim());
      this.newTrigger = '';
    }
  }

  removeTrigger(index: number): void { this.form.triggers.splice(index, 1); }

  saveEntry(): void {
    if (!this.effectiveSymptom) {
      this.toastService.show('⚠️ Please select or enter a symptom');
      return;
    }

    this.saving = true;
    this.http.post<SymptomEntry>(this.apiBase, {
      logDate: this.form.logDate,
      symptom: this.effectiveSymptom,
      severity: this.form.severity,
      timeOfDay: this.form.timeOfDay || null,
      duration: this.form.duration,
      notes: this.form.notes,
      mood: this.form.mood,
      energyLevel: this.form.energyLevel,
      stressLevel: this.form.stressLevel,
      tags: this.form.tags,
      triggers: this.form.triggers,
    }).subscribe({
      next: () => {
        this.toastService.show('✅ Symptom logged!');
        this.resetForm();
        this.loadEntries();
        this.loadDistinctSymptoms();
        this.saving = false;
      },
      error: () => {
        this.toastService.show('❌ Failed to save — is the backend running?');
        this.saving = false;
      }
    });
  }

  deleteEntry(id: number): void {
    this.http.delete(`${this.apiBase}/${id}`).subscribe({
      next: () => {
        this.entries = this.entries.filter(e => e.id !== id);
        this.toastService.show('🗑️ Entry deleted');
      }
    });
  }

  resetForm(): void {
    this.form = {
      logDate: new Date().toISOString().split('T')[0],
      symptom: '', customSymptom: '', severity: 3,
      timeOfDay: '', duration: null, notes: '',
      mood: 3, energyLevel: 3, stressLevel: 3,
      tags: [], triggers: [],
    };
  }

  // ── History Filters ───────────────────────────

  get filteredEntries(): SymptomEntry[] {
    if (this.historyFilter === 'all') return this.entries;
    return this.entries.filter(e => e.symptom === this.historyFilter);
  }

  // ── Display Helpers ───────────────────────────

  severityLabel(sev: number): string {
    const map: Record<number, string> = { 1: 'Mild', 2: 'Light', 3: 'Moderate', 4: 'Severe', 5: 'Very Severe' };
    return map[sev] ?? '';
  }

  severityColor(sev: number): string {
    const map: Record<number, string> = {
      1: '#7a9e7e', 2: '#a8c5ac', 3: '#e88f68', 4: '#c96a3f', 5: '#a8532c'
    };
    return map[sev] ?? '#8a7e78';
  }

  moodEmoji(val: number): string {
    const map: Record<number, string> = { 1: '😞', 2: '😕', 3: '😐', 4: '🙂', 5: '😊' };
    return map[val] ?? '😐';
  }

  scaleLabel(val: number): string {
    const map: Record<number, string> = { 1: 'Very Low', 2: 'Low', 3: 'Medium', 4: 'High', 5: 'Very High' };
    return map[val] ?? '';
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  patternSeverityColor(severity: string): string {
    const map: Record<string, string> = { info: '#4ab8f0', warning: '#e88f68', critical: '#c96a3f' };
    return map[severity] ?? '#8a7e78';
  }

  correlationStrengthLabel(strength: number): string {
    if (strength >= 0.7) return 'Strong';
    if (strength >= 0.4) return 'Moderate';
    return 'Mild';
  }

  // Switch to insights and auto-load
  showInsights(): void {
    this.activeView = 'insights';
    if (!this.analysis) this.loadAnalysis();
  }
  roundNum(val: number): number {
  return Math.round(val);
}
}