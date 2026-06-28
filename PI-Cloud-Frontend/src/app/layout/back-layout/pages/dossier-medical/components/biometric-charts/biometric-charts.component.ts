import { Component, Input, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { DossierDataService } from '../../services/dossier-data.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-biometric-charts',
  templateUrl: './biometric-charts.component.html',
  styleUrls: ['./biometric-charts.component.scss']
})
export class BiometricChartsComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() clientId!: number;

  @ViewChild('weightChart')  weightChartRef!:  ElementRef;
  @ViewChild('bmiChart')     bmiChartRef!:     ElementRef;
  @ViewChild('bpChart')      bpChartRef!:      ElementRef;
  @ViewChild('glucoseChart') glucoseChartRef!: ElementRef;

  private charts: Chart[] = [];
  labels: string[] = [];

  weightData:   number[] = [];
  bmiData:      number[] = [];
  systolicData: number[] = [];
  diastolicData:number[] = [];
  glucoseData:  number[] = [];

  constructor(private dossierService: DossierDataService) {}

  ngOnInit(): void {
    const entries = this.dossierService.getBiometrics(this.clientId);
    this.labels        = entries.map(e => e.date);
    this.weightData    = entries.map(e => e.weight);
    this.bmiData       = entries.map(e => e.bmi);
    this.systolicData  = entries.map(e => e.systolic ?? 0);
    this.diastolicData = entries.map(e => e.diastolic ?? 0);
    this.glucoseData   = entries.map(e => e.glucose ?? 0);
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.buildCharts(), 100);
  }

  buildCharts(): void {
    this.charts.push(this.createLineChart(
      this.weightChartRef.nativeElement, 'Weight (kg)',
      this.labels, this.weightData, '#c96a3f'
    ));
    this.charts.push(this.createLineChart(
      this.bmiChartRef.nativeElement, 'BMI',
      this.labels, this.bmiData, '#e88f68',
      [{ value: 18.5, label: 'Underweight', color: '#4ab8f0' },
       { value: 25,   label: 'Normal',      color: '#7a9e7e' },
       { value: 30,   label: 'Overweight',  color: '#e88f68' }]
    ));
    this.charts.push(this.createMultiLineChart(
      this.bpChartRef.nativeElement,
      this.labels,
      [
        { label: 'Systolic (mmHg)',  data: this.systolicData,  color: '#c96a3f' },
        { label: 'Diastolic (mmHg)', data: this.diastolicData, color: '#7a9e7e' },
      ]
    ));
    this.charts.push(this.createLineChart(
      this.glucoseChartRef.nativeElement, 'Glucose (mg/dL)',
      this.labels, this.glucoseData, '#a47cf0'
    ));
  }

  createLineChart(
    canvas: HTMLCanvasElement, label: string,
    labels: string[], data: number[], color: string,
    thresholds: { value: number; label: string; color: string }[] = []
  ): Chart {
    const annotations: any = {};
    thresholds.forEach((t, i) => {
      annotations[`line${i}`] = {
        type: 'line', yMin: t.value, yMax: t.value,
        borderColor: t.color, borderWidth: 1.5,
        borderDash: [4, 4],
        label: { content: t.label, display: true, position: 'end', font: { size: 10 } }
      };
    });

    return new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label,
          data,
          borderColor: color,
          backgroundColor: color + '18',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: color,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { mode: 'index', intersect: false }
        },
        scales: {
          x: { grid: { color: '#f0ebe5' }, ticks: { font: { size: 11 }, color: '#b5aaa5' } },
          y: { grid: { color: '#f0ebe5' }, ticks: { font: { size: 11 }, color: '#b5aaa5' } }
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
          borderColor: s.color,
          backgroundColor: s.color + '10',
          fill: false, tension: 0.4,
          pointBackgroundColor: s.color,
          pointBorderColor: '#fff',
          pointBorderWidth: 2, pointRadius: 5,
        }))
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, color: '#8a7e78' } } },
        scales: {
          x: { grid: { color: '#f0ebe5' }, ticks: { font: { size: 11 }, color: '#b5aaa5' } },
          y: { grid: { color: '#f0ebe5' }, ticks: { font: { size: 11 }, color: '#b5aaa5' } }
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.charts.forEach(c => c.destroy());
  }
}