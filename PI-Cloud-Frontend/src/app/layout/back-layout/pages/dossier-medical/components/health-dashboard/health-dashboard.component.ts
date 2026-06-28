import { Component, Input, OnInit } from '@angular/core';
import { DossierDataService } from '../../services/dossier-data.service';
import { BiometricEntry } from '../../models/dossier.models';

@Component({
  selector: 'app-health-dashboard',
  templateUrl: './health-dashboard.component.html',
  styleUrls: ['./health-dashboard.component.scss']
})
export class HealthDashboardComponent implements OnInit {
  @Input() clientId!: number;

  latest: BiometricEntry | null = null;
  previous: BiometricEntry | null = null;
  bmiCategory = { label: '', color: '' };

  metrics: any[] = [];

  constructor(private dossierService: DossierDataService) {}

  ngOnInit(): void {
    const entries = this.dossierService.getBiometrics(this.clientId);
    this.latest   = entries[entries.length - 1] ?? null;
    this.previous = entries[entries.length - 2] ?? null;

    if (this.latest) {
      this.bmiCategory = this.dossierService.getBMICategory(this.latest.bmi);
      this.buildMetrics();
    }
  }

  buildMetrics(): void {
    if (!this.latest) return;
    const l = this.latest;
    const p = this.previous;

    this.metrics = [
      {
        label: 'Weight', value: `${l.weight} kg`, icon: '⚖️',
        change: p ? l.weight - p.weight : null,
        unit: 'kg', color: '#c96a3f',
        good: p ? l.weight <= p.weight : true
      },
      {
        label: 'BMI', value: `${l.bmi}`, icon: '📏',
        change: p ? Math.round((l.bmi - p.bmi) * 10) / 10 : null,
        unit: '', color: this.bmiCategory.color,
        badge: this.bmiCategory.label,
        good: p ? l.bmi <= p.bmi : true
      },
      {
        label: 'Body Fat', value: l.bodyFat ? `${l.bodyFat}%` : '—', icon: '🔬',
        change: p && l.bodyFat && p.bodyFat ? l.bodyFat - p.bodyFat : null,
        unit: '%', color: '#e88f68',
        good: p && l.bodyFat && p.bodyFat ? l.bodyFat <= p.bodyFat : true
      },
      {
        label: 'Muscle Mass', value: l.muscleMass ? `${l.muscleMass} kg` : '—', icon: '💪',
        change: p && l.muscleMass && p.muscleMass ? l.muscleMass - p.muscleMass : null,
        unit: 'kg', color: '#7a9e7e',
        good: p && l.muscleMass && p.muscleMass ? l.muscleMass >= p.muscleMass : true
      },
      {
        label: 'Blood Pressure', value: l.systolic ? `${l.systolic}/${l.diastolic}` : '—', icon: '❤️',
        change: null, unit: 'mmHg', color: '#a47cf0',
        status: l.systolic && l.systolic > 140 ? 'High' : l.systolic && l.systolic > 130 ? 'Elevated' : 'Normal',
        statusColor: l.systolic && l.systolic > 140 ? '#c96a3f' : l.systolic && l.systolic > 130 ? '#e88f68' : '#7a9e7e',
        good: !l.systolic || l.systolic <= 130
      },
      {
        label: 'Glucose', value: l.glucose ? `${l.glucose} mg/dL` : '—', icon: '🩸',
        change: p && l.glucose && p.glucose ? l.glucose - p.glucose : null,
        unit: 'mg/dL', color: '#4ab8f0',
        status: l.glucose && l.glucose > 126 ? 'Diabetic' : l.glucose && l.glucose > 100 ? 'Pre-diabetic' : 'Normal',
        statusColor: l.glucose && l.glucose > 126 ? '#c96a3f' : l.glucose && l.glucose > 100 ? '#e88f68' : '#7a9e7e',
        good: !l.glucose || l.glucose <= 100
      },
    ];
  }

  changeLabel(change: number | null, good: boolean): string {
    if (change === null) return '';
    const sign = change > 0 ? '+' : '';
    return `${sign}${change}`;
  }
}