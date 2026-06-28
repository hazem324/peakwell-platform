import { Component, Input, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { DossierDataService } from '../../services/dossier-data.service';
import { ToastServiceService } from '../../../../../../services/toast-service.service';
import { BiometricEntry } from '../../models/dossier.models';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-biometric-form',
  templateUrl: './biometric-form.component.html',
  styleUrls: ['./biometric-form.component.scss']
})
export class BiometricFormComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() clientId!: number;

  @ViewChild('weightChart')  weightChartRef!:  ElementRef;
  @ViewChild('bmiChart')     bmiChartRef!:     ElementRef;
  @ViewChild('bpChart')      bpChartRef!:      ElementRef;
  @ViewChild('glucoseChart') glucoseChartRef!: ElementRef;

  private charts: Chart[] = [];

  // Form fields
  weight     = 0;
  height     = 0;
  bodyFat    = 0;
  muscleMass = 0;
  systolic   = 0;
  diastolic  = 0;
  glucose    = 0;
  notes      = '';

  bmi      = 0;
  bmiLabel = '';
  bmiColor = '';

  // Dashboard data
  latest:      BiometricEntry | null = null;
  previous:    BiometricEntry | null = null;
  bmiCategory  = { label: '', color: '' };
  metrics:     any[] = [];
  entries:     BiometricEntry[] = [];

  constructor(
    private toastService: ToastServiceService,
    private dossierService: DossierDataService
  ) {}

  ngOnInit(): void {
    this.entries  = this.dossierService.getBiometrics(this.clientId);
    this.latest   = this.entries[this.entries.length - 1] ?? null;
    this.previous = this.entries[this.entries.length - 2] ?? null;

    if (this.latest) {
      this.bmiCategory = this.dossierService.getBMICategory(this.latest.bmi);
      this.buildMetrics();
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.buildCharts(), 100);
  }

  buildMetrics(): void {
    if (!this.latest) return;
    const l = this.latest;
    const p = this.previous;

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
        label: 'Body Fat', value: l.bodyFat ? `${l.bodyFat}` : '—', unit: '%', icon: '🔬',
        change: p && l.bodyFat && p.bodyFat ? +(l.bodyFat - p.bodyFat).toFixed(1) : null,
        color: '#e88f68', good: p && l.bodyFat && p.bodyFat ? l.bodyFat <= p.bodyFat : true
      },
      {
        label: 'Muscle Mass', value: l.muscleMass ? `${l.muscleMass}` : '—', unit: 'kg', icon: '💪',
        change: p && l.muscleMass && p.muscleMass ? +(l.muscleMass - p.muscleMass).toFixed(1) : null,
        color: '#7a9e7e', good: p && l.muscleMass && p.muscleMass ? l.muscleMass >= p.muscleMass : true
      },
      {
        label: 'Blood Pressure',
        value: l.systolic ? `${l.systolic}/${l.diastolic}` : '—', unit: 'mmHg', icon: '❤️',
        change: null, color: '#a47cf0',
        status: l.systolic && l.systolic > 140 ? 'High'
              : l.systolic && l.systolic > 130 ? 'Elevated' : 'Normal',
        statusColor: l.systolic && l.systolic > 140 ? '#c96a3f'
                   : l.systolic && l.systolic > 130 ? '#e88f68' : '#7a9e7e',
        good: !l.systolic || l.systolic <= 130
      },
      {
        label: 'Glucose', value: l.glucose ? `${l.glucose}` : '—', unit: 'mg/dL', icon: '🩸',
        change: p && l.glucose && p.glucose ? +(l.glucose - p.glucose).toFixed(1) : null,
        color: '#4ab8f0',
        status: l.glucose && l.glucose > 126 ? 'Diabetic'
              : l.glucose && l.glucose > 100 ? 'Pre-diabetic' : 'Normal',
        statusColor: l.glucose && l.glucose > 126 ? '#c96a3f'
                   : l.glucose && l.glucose > 100 ? '#e88f68' : '#7a9e7e',
        good: !l.glucose || l.glucose <= 100
      },
    ];
  }

  buildCharts(): void {
    if (this.entries.length < 2) return;
    const labels = this.entries.map(e => e.date);

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

  onWeightOrHeightChange(): void {
    if (this.weight > 0 && this.height > 0) {
      this.bmi      = this.dossierService.calculateBMI(this.weight, this.height);
      const cat     = this.dossierService.getBMICategory(this.bmi);
      this.bmiLabel = cat.label;
      this.bmiColor = cat.color;
    }
  }

  changeLabel(change: number | null, good: boolean): string {
    if (change === null) return '';
    const sign = change > 0 ? '+' : '';
    return `${sign}${change}`;
  }

  submit(): void {
    if (!this.weight || !this.height) {
      this.toastService.show('⚠️ Weight and height are required');
      return;
    }
    this.toastService.show('✅ Biometric entry saved successfully!');
    this.reset();
  }

  reset(): void {
    this.weight = 0; this.height = 0; this.bodyFat = 0;
    this.muscleMass = 0; this.systolic = 0; this.diastolic = 0;
    this.glucose = 0; this.notes = ''; this.bmi = 0;
  }

  ngOnDestroy(): void {
    this.charts.forEach(c => c.destroy());
  }
}
