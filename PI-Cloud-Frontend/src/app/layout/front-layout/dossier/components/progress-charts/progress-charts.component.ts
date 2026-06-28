import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { DossierService } from '../../services/dossier.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-progress-charts',
  templateUrl: './progress-charts.component.html',
  styleUrls: ['./progress-charts.component.scss']
})
export class ProgressChartsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('weightCanvas') weightRef!: ElementRef;
  @ViewChild('bmiCanvas')    bmiRef!:    ElementRef;
  @ViewChild('bpCanvas')     bpRef!:     ElementRef;
  @ViewChild('glucoseCanvas')glucoseRef!:ElementRef;

  private charts: Chart[] = [];
  labels: string[] = [];
  weightData: number[] = [];
  bmiData: number[] = [];
  systolicData: number[] = [];
  diastolicData: number[] = [];
  glucoseData: number[] = [];

  constructor(private dossierService: DossierService) {}

ngOnInit(): void {
  // Use live entries from the service instead of hardcoded data
  this.dossierService.entries$.subscribe(entries => {
    this.labels        = entries.map(e =>
      new Date(e.recordedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    );
    this.weightData    = entries.map(e => e.weight);
    this.bmiData       = entries.map(e => e.bmi);
    this.systolicData  = entries.map(e => e.systolic  ?? 0);
    this.diastolicData = entries.map(e => e.diastolic ?? 0);
    this.glucoseData   = entries.map(e => e.glucose   ?? 0);
  });
}

  ngAfterViewInit(): void {
    setTimeout(() => this.buildCharts(), 100);
  }

  buildCharts(): void {
    this.charts = [
      this.line(this.weightRef.nativeElement,  'Weight (kg)',   this.labels, this.weightData,    '#c96a3f'),
      this.line(this.bmiRef.nativeElement,     'BMI',           this.labels, this.bmiData,        '#e88f68'),
      this.multi(this.bpRef.nativeElement,     this.labels, [
        { label: 'Systolic',  data: this.systolicData,  color: '#c96a3f' },
        { label: 'Diastolic', data: this.diastolicData, color: '#7a9e7e' },
      ]),
      this.line(this.glucoseRef.nativeElement, 'Glucose (mg/dL)', this.labels, this.glucoseData, '#a47cf0'),
    ];
  }

  line(canvas: HTMLCanvasElement, label: string, labels: string[], data: number[], color: string): Chart {
    return new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label, data, borderColor: color,
          backgroundColor: color + '18', fill: true, tension: 0.4,
          pointBackgroundColor: color, pointBorderColor: '#fff',
          pointBorderWidth: 2, pointRadius: 5,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: '#f0ebe5' }, ticks: { color: '#b5aaa5', font: { size: 11 } } },
          y: { grid: { color: '#f0ebe5' }, ticks: { color: '#b5aaa5', font: { size: 11 } } }
        }
      }
    });
  }

  multi(canvas: HTMLCanvasElement, labels: string[], series: { label: string; data: number[]; color: string }[]): Chart {
    return new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: series.map(s => ({
          label: s.label, data: s.data, borderColor: s.color,
          backgroundColor: s.color + '10', fill: false, tension: 0.4,
          pointBackgroundColor: s.color, pointBorderColor: '#fff',
          pointBorderWidth: 2, pointRadius: 5,
        }))
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { color: '#8a7e78', font: { size: 11 } } } },
        scales: {
          x: { grid: { color: '#f0ebe5' }, ticks: { color: '#b5aaa5', font: { size: 11 } } },
          y: { grid: { color: '#f0ebe5' }, ticks: { color: '#b5aaa5', font: { size: 11 } } }
        }
      }
    });
  }

  ngOnDestroy(): void { this.charts.forEach(c => c.destroy()); }
}