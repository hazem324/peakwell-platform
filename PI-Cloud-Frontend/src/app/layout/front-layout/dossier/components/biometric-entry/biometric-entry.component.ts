import { Component, EventEmitter, OnInit, AfterViewInit, OnDestroy, Output, ViewChild, ElementRef } from '@angular/core';
import { DossierService } from '../../services/dossier.service';
import { ToastServiceService } from '../../../../../services/toast-service.service';
import { NotificationService } from '../../../../../services/notification.service';
import { BiometricResponse, HealthAlertDto } from '../../services/api.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-biometric-entry',
  templateUrl: './biometric-entry.component.html',
  styleUrls: ['./biometric-entry.component.scss']
})
export class BiometricEntryComponent implements OnInit, AfterViewInit, OnDestroy {
  @Output() saved = new EventEmitter<void>();

  @ViewChild('weightChart')  weightChartRef!:  ElementRef;
  @ViewChild('bmiChart')     bmiChartRef!:     ElementRef;
  @ViewChild('bpChart')      bpChartRef!:      ElementRef;
  @ViewChild('glucoseChart') glucoseChartRef!: ElementRef;

  private charts: Chart[] = [];
  private chartsBuilt = false;

  // Form fields
  weight     = 0;
  bodyFat    = 0;
  muscleMass = 0;
  systolic   = 0;
  diastolic  = 0;
  glucose    = 0;
  notes      = '';
  saving     = false;
  submitted  = false;

  bmi      = 0;
  bmiLabel = '';
  bmiColor = '';

  // Dashboard state
  latest:        BiometricResponse | null = null;
  previous:      BiometricResponse | null = null;
  bmiCategory    = { label: '', color: '' };
  metrics:       any[] = [];
  entries:       BiometricResponse[] = [];

  // Alerts state
  alerts:        HealthAlertDto[] = [];
  alertsLoading  = true;

  constructor(
    public  dossierService: DossierService,
    private toastService: ToastServiceService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.dossierService.getAlerts().subscribe({
      next: a  => { this.alerts = a; this.alertsLoading = false; },
      error: () => { this.alertsLoading = false; }
    });

    this.dossierService.entries$.subscribe(entries => {
      this.entries  = entries;
      this.latest   = this.dossierService.latest;
      this.previous = this.dossierService.previous;

      if (this.latest) {
        this.bmiCategory = this.dossierService.getBMICategory(this.latest.bmi);
        this.buildMetrics();
      }

      if (this.chartsBuilt) {
        this.destroyCharts();
        setTimeout(() => this.buildCharts(), 50);
      }
    });
  }

  ngAfterViewInit(): void {
    this.chartsBuilt = true;
    setTimeout(() => this.buildCharts(), 100);
  }

  buildMetrics(): void {
    const l = this.latest;
    const p = this.previous;
    if (!l) return;

    this.metrics = [
      {
        label: 'Weight', value: `${l.weight}`, unit: 'kg', icon: '⚖️',
        change: p ? +(l.weight - p.weight).toFixed(1) : null,
        color: '#c96a3f', good: p ? l.weight <= p.weight : true
      },
      {
        label: 'BMI', value: `${l.bmi}`, unit: '', icon: '📏',
        change: p ? +(l.bmi - p.bmi).toFixed(1) : null,
        color: this.bmiCategory.color, badge: this.bmiCategory.label,
        good: p ? l.bmi <= p.bmi : true
      },
      {
        label: 'Body Fat',
        value: l.bodyFat != null ? `${l.bodyFat}` : '—', unit: '%', icon: '🔬',
        change: p && l.bodyFat != null && p.bodyFat != null
                  ? +(l.bodyFat - p.bodyFat).toFixed(1) : null,
        color: '#e88f68',
        good: p && l.bodyFat != null && p.bodyFat != null ? l.bodyFat <= p.bodyFat : true
      },
      {
        label: 'Muscle Mass',
        value: l.muscleMass != null ? `${l.muscleMass}` : '—', unit: 'kg', icon: '💪',
        change: p && l.muscleMass != null && p.muscleMass != null
                  ? +(l.muscleMass - p.muscleMass).toFixed(1) : null,
        color: '#7a9e7e',
        good: p && l.muscleMass != null && p.muscleMass != null ? l.muscleMass >= p.muscleMass : true
      },
      {
        label: 'Blood Pressure',
        value: l.systolic != null ? `${l.systolic}/${l.diastolic}` : '—',
        unit: 'mmHg', icon: '❤️', change: null, color: '#a47cf0',
        status: l.systolic == null ? '' : l.systolic > 140 ? 'High' : l.systolic > 130 ? 'Elevated' : 'Normal',
        statusColor: l.systolic == null ? '' : l.systolic > 140 ? '#c96a3f' : l.systolic > 130 ? '#e88f68' : '#7a9e7e',
        good: l.systolic == null || l.systolic <= 130
      },
      {
        label: 'Glucose',
        value: l.glucose != null ? `${l.glucose}` : '—', unit: 'mg/dL', icon: '🩸',
        change: p && l.glucose != null && p.glucose != null
                  ? +(l.glucose - p.glucose).toFixed(1) : null,
        color: '#4ab8f0',
        status: l.glucose == null ? '' : l.glucose > 126 ? 'Diabetic' : l.glucose > 100 ? 'Pre-diabetic' : 'Normal',
        statusColor: l.glucose == null ? '' : l.glucose > 126 ? '#c96a3f' : l.glucose > 100 ? '#e88f68' : '#7a9e7e',
        good: l.glucose == null || l.glucose <= 100
      },
    ];
  }

  buildCharts(): void {
    if (this.entries.length < 2) return;
    if (!this.weightChartRef) return;

    const labels = this.entries.map(e =>
      new Date(e.recordedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    );

    this.charts.push(this.createLineChart(
      this.weightChartRef.nativeElement, 'Weight (kg)',
      labels, this.entries.map(e => e.weight), '#c96a3f'
    ));
    this.charts.push(this.createLineChart(
      this.bmiChartRef.nativeElement, 'BMI',
      labels, this.entries.map(e => e.bmi), '#e88f68'
    ));
    this.charts.push(this.createMultiLineChart(
      this.bpChartRef.nativeElement, labels,
      [
        { label: 'Systolic',  data: this.entries.map(e => e.systolic  ?? 0), color: '#c96a3f' },
        { label: 'Diastolic', data: this.entries.map(e => e.diastolic ?? 0), color: '#7a9e7e' },
      ]
    ));
    this.charts.push(this.createLineChart(
      this.glucoseChartRef.nativeElement, 'Glucose (mg/dL)',
      labels, this.entries.map(e => e.glucose ?? 0), '#a47cf0'
    ));
  }

  createLineChart(
    canvas: HTMLCanvasElement, label: string,
    labels: string[], data: number[], color: string
  ): Chart {
    return new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label, data,
          borderColor: color,
          backgroundColor: color + '18',
          fill: true, tension: 0.4,
          pointBackgroundColor: color,
          pointBorderColor: '#fff',
          pointBorderWidth: 2, pointRadius: 4,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
        scales: {
          x: { grid: { color: '#f0ebe5' }, ticks: { font: { size: 10 }, color: '#b5aaa5' } },
          y: { grid: { color: '#f0ebe5' }, ticks: { font: { size: 10 }, color: '#b5aaa5' } }
        }
      }
    });
  }

  createMultiLineChart(
    canvas: HTMLCanvasElement, labels: string[],
    series: { label: string; data: number[]; color: string }[]
  ): Chart {
    return new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: series.map(s => ({
          label: s.label, data: s.data,
          borderColor: s.color, backgroundColor: s.color + '10',
          fill: false, tension: 0.4,
          pointBackgroundColor: s.color,
          pointBorderColor: '#fff',
          pointBorderWidth: 2, pointRadius: 4,
        }))
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 10 }, color: '#8a7e78', boxWidth: 12 } }
        },
        scales: {
          x: { grid: { color: '#f0ebe5' }, ticks: { font: { size: 10 }, color: '#b5aaa5' } },
          y: { grid: { color: '#f0ebe5' }, ticks: { font: { size: 10 }, color: '#b5aaa5' } }
        }
      }
    });
  }

  get profileHeight(): number { return this.dossierService.profile?.height ?? 0; }

  onMeasureChange(): void {
    if (this.weight > 0 && this.profileHeight > 0) {
      this.bmi = this.dossierService.calculateBMI(this.weight, this.profileHeight);
      const cat = this.dossierService.getBMICategory(this.bmi);
      this.bmiLabel = cat.label;
      this.bmiColor = cat.color;
    } else {
      this.bmi = 0;
    }
  }

  scaleWidth(bmi: number): string {
    return Math.min((bmi / 40) * 100, 100) + '%';
  }

  changeLabel(change: number | null, _good: boolean): string {
    if (change === null) return '';
    const sign = change > 0 ? '+' : '';
    return `${sign}${change}`;
  }

  alertColor(type: string): string {
    return ({ danger: '#c96a3f', warning: '#e88f68', info: '#7a9e7e' } as any)[type] ?? '#b5aaa5';
  }
  alertBg(type: string): string {
    return ({ danger: 'rgba(201,106,63,0.06)', warning: 'rgba(232,143,104,0.06)', info: 'rgba(122,158,126,0.06)' } as any)[type] ?? '#faf7f4';
  }
  alertIcon(type: string): string {
    return ({ danger: '🚨', warning: '⚠️', info: '✅' } as any)[type] ?? 'ℹ️';
  }
  get alertDangerCount()  { return this.alerts.filter(a => a.type === 'danger').length; }
  get alertWarningCount() { return this.alerts.filter(a => a.type === 'warning').length; }
  get alertInfoCount()    { return this.alerts.filter(a => a.type === 'info').length; }

  // ── Plausibility warnings (compare to latest entry) ──────────────
  private daysSinceLatest(): number {
    if (!this.latest) return 1;
    const ms = Date.now() - new Date(this.latest.recordedAt).getTime();
    return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
  }

  get weightWarning(): string | null {
    if (!this.latest || !this.weight) return null;
    const days = this.daysSinceLatest();
    const max = days * 0.8;
    const diff = Math.abs(this.weight - this.latest.weight);
    if (diff > max) {
      return `Differs by ${diff.toFixed(1)} kg from your last entry (${this.latest.weight} kg). Max expected over ${days} day(s): ${max.toFixed(1)} kg (800 g/day).`;
    }
    return null;
  }

  get bodyFatWarning(): string | null {
    if (!this.latest || !this.bodyFat || this.latest.bodyFat == null) return null;
    const days = this.daysSinceLatest();
    const max = days * 0.2;
    const diff = Math.abs(this.bodyFat - this.latest.bodyFat);
    if (diff > max) {
      return `Differs by ${diff.toFixed(1)}% from your last entry (${this.latest.bodyFat}%). Max expected over ${days} day(s): ${max.toFixed(1)}%.`;
    }
    return null;
  }

  get muscleMassWarning(): string | null {
    if (!this.latest || !this.muscleMass || this.latest.muscleMass == null) return null;
    const days = this.daysSinceLatest();
    const max = days * 0.1;
    const diff = Math.abs(this.muscleMass - this.latest.muscleMass);
    if (diff > max) {
      return `Differs by ${diff.toFixed(1)} kg from your last entry (${this.latest.muscleMass} kg). Max expected over ${days} day(s): ${max.toFixed(1)} kg.`;
    }
    return null;
  }

  get systolicWarning(): string | null {
    if (!this.latest || !this.systolic || this.latest.systolic == null) return null;
    const days = this.daysSinceLatest();
    const max = days * 10;
    const diff = Math.abs(this.systolic - this.latest.systolic);
    if (diff > max) {
      return `Differs by ${diff} mmHg from your last entry (${this.latest.systolic} mmHg). Max expected over ${days} day(s): ${max} mmHg.`;
    }
    return null;
  }

  get diastolicWarning(): string | null {
    if (!this.latest || !this.diastolic || this.latest.diastolic == null) return null;
    const days = this.daysSinceLatest();
    const max = days * 7;
    const diff = Math.abs(this.diastolic - this.latest.diastolic);
    if (diff > max) {
      return `Differs by ${diff} mmHg from your last entry (${this.latest.diastolic} mmHg). Max expected over ${days} day(s): ${max} mmHg.`;
    }
    return null;
  }

  get glucoseWarning(): string | null {
    if (!this.latest || !this.glucose || this.latest.glucose == null) return null;
    const days = this.daysSinceLatest();
    const max = days * 15;
    const diff = Math.abs(this.glucose - this.latest.glucose);
    if (diff > max) {
      return `Differs by ${diff.toFixed(1)} mg/dL from your last entry (${this.latest.glucose} mg/dL). Max expected over ${days} day(s): ${max.toFixed(1)} mg/dL.`;
    }
    return null;
  }

  // ── Validation ────────────────────────────────────────────────────
  get gender(): string {
    return (this.dossierService.profile?.gender ?? '').toLowerCase();
  }

  // Body fat ranges: male 2–50, female 10–60, unknown uses female range (wider)
  get bodyFatMin(): number { return this.gender === 'male' ? 2  : 10; }
  get bodyFatMax(): number { return this.gender === 'male' ? 50 : 60; }
  get bodyFatRangeLabel(): string {
    return `${this.bodyFatMin}–${this.bodyFatMax}% (${this.gender === 'male' ? 'male' : 'female'})`;
  }

  get weightInvalid(): boolean {
    return this.submitted && (!this.weight || this.weight < 30 || this.weight > 250);
  }

  get bodyFatInvalid(): boolean {
    return this.submitted && !!this.bodyFat &&
           (this.bodyFat < this.bodyFatMin || this.bodyFat > this.bodyFatMax);
  }

  get muscleMassInvalid(): boolean {
    return this.submitted && !!this.muscleMass && (this.muscleMass < 1 || this.muscleMass > 200);
  }

  get systolicInvalid(): boolean {
    return this.submitted && !!this.systolic && (this.systolic < 70 || this.systolic > 200);
  }

  get diastolicInvalid(): boolean {
    return this.submitted && !!this.diastolic && (this.diastolic < 40 || this.diastolic > 120);
  }

  get bpPartialInvalid(): boolean {
    return this.submitted && ((!!this.systolic && !this.diastolic) || (!this.systolic && !!this.diastolic));
  }

  get glucoseInvalid(): boolean {
    return this.submitted && !!this.glucose && (this.glucose < 50 || this.glucose > 300);
  }

  get isFormValid(): boolean {
    return !!this.weight &&
           !this.bodyFatInvalid && !this.muscleMassInvalid &&
           !this.systolicInvalid && !this.diastolicInvalid &&
           !this.bpPartialInvalid && !this.glucoseInvalid;
  }

  submit(): void {
    this.submitted = true;
    if (!this.isFormValid) {
      this.toastService.show('⚠️ Please fix the errors before saving');
      return;
    }
    this.saving = true;
    this.dossierService.addBiometric({
      weight:     this.weight,
      height:     this.profileHeight,
      bodyFat:    this.bodyFat    || null,
      muscleMass: this.muscleMass || null,
      systolic:   this.systolic   || null,
      diastolic:  this.diastolic  || null,
      glucose:    this.glucose    || null,
      notes:      this.notes,
    }).subscribe({
      next: () => {
        this.toastService.show('✅ Measurement saved!');
        this.saving = false;
        this.saved.emit();
        this.notificationService.triggerCheck().subscribe({
          next: () => this.notificationService.refresh()
        });
      },
      error: (err) => {
        const msg = err?.error && typeof err.error === 'string'
          ? err.error
          : 'Failed to save. Is the backend running?';
        this.toastService.show('❌ ' + msg);
        this.saving = false;
      }
    });
  }

  private destroyCharts(): void {
    this.charts.forEach(c => c.destroy());
    this.charts = [];
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }
}