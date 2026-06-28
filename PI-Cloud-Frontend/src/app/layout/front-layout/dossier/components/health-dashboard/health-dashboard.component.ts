import { Component, OnInit } from '@angular/core';
import { DossierService } from '../../services/dossier.service';

@Component({
  selector: 'app-health-dashboard',
  templateUrl: './health-dashboard.component.html',
  styleUrls: ['./health-dashboard.component.scss']
})
export class HealthDashboardComponent implements OnInit {
  metrics:  any[] = [];
  hasData   = false;
  bmiLabel  = '';
  bmiColor  = '';
  latest:   any   = null;
  lastDate  = '';

  constructor(public dossierService: DossierService) {}

  ngOnInit(): void {
    this.dossierService.entries$.subscribe(() => this.build());
  }

  build(): void {
    const l = this.dossierService.latest;
    const p = this.dossierService.previous;
    this.latest  = l;
    this.hasData = !!l;
    if (!l) return;

    const bmiCat  = this.dossierService.getBMICategory(l.bmi);
    this.bmiLabel = bmiCat.label;
    this.bmiColor = bmiCat.color;
    this.lastDate = new Date(l.recordedAt).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });

    this.metrics = [
      { label: 'Weight',         icon: '⚖️', color: '#c96a3f',  value: `${l.weight} kg`,                      change: p ? Math.round((l.weight - p.weight) * 10) / 10 : null,        unit: 'kg',    good: p ? l.weight <= p.weight : true },
      { label: 'BMI',            icon: '📏', color: bmiCat.color, value: `${l.bmi}`,                           change: p ? Math.round((l.bmi - p.bmi) * 10) / 10 : null,              unit: '',      good: p ? l.bmi <= p.bmi : true, status: bmiCat.label, statusColor: bmiCat.color },
      { label: 'Body Fat',       icon: '🔬', color: '#e88f68',  value: l.bodyFat    ? `${l.bodyFat}%`    : '—', change: p && l.bodyFat && p.bodyFat ? l.bodyFat - p.bodyFat : null,     unit: '%',     good: p && l.bodyFat && p.bodyFat ? l.bodyFat <= p.bodyFat : true },
      { label: 'Muscle Mass',    icon: '💪', color: '#7a9e7e',  value: l.muscleMass ? `${l.muscleMass} kg` : '—', change: p && l.muscleMass && p.muscleMass ? l.muscleMass - p.muscleMass : null, unit: 'kg', good: p && l.muscleMass && p.muscleMass ? l.muscleMass >= p.muscleMass : true },
      { label: 'Blood Pressure', icon: '❤️', color: '#a47cf0',  value: l.systolic   ? `${l.systolic}/${l.diastolic}` : '—', change: null, unit: 'mmHg', good: !l.systolic || l.systolic <= 130, status: !l.systolic ? '' : l.systolic > 140 ? 'High' : l.systolic > 130 ? 'Elevated' : 'Normal', statusColor: !l.systolic ? '' : l.systolic > 140 ? '#c96a3f' : l.systolic > 130 ? '#e88f68' : '#7a9e7e' },
      { label: 'Glucose',        icon: '🩸', color: '#4ab8f0',  value: l.glucose    ? `${l.glucose} mg/dL` : '—', change: p && l.glucose && p.glucose ? Math.round((l.glucose - p.glucose) * 10) / 10 : null, unit: 'mg/dL', good: !l.glucose || l.glucose <= 100, status: !l.glucose ? '' : l.glucose > 126 ? 'Diabetic' : l.glucose > 100 ? 'Pre-diabetic' : 'Normal', statusColor: !l.glucose ? '' : l.glucose > 126 ? '#c96a3f' : l.glucose > 100 ? '#e88f68' : '#7a9e7e' },
    ];
  }

  changeStr(change: number | null): string {
    if (change === null || change === 0) return '';
    return (change > 0 ? '+' : '') + change;
  }
}