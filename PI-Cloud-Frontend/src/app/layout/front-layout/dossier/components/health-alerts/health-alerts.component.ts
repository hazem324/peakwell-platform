import { Component, OnInit } from '@angular/core';
import { DossierService } from '../../services/dossier.service';
import { HealthAlertDto } from '../../services/api.service';

@Component({
  selector: 'app-health-alerts',
  templateUrl: './health-alerts.component.html',
  styleUrls: ['./health-alerts.component.scss']
})
export class HealthAlertsComponent implements OnInit {
  alerts: HealthAlertDto[] = [];
  loading = true;

  constructor(private dossierService: DossierService) {}

  ngOnInit(): void {
    this.dossierService.getAlerts().subscribe({
      next: alerts => { this.alerts = alerts; this.loading = false; },
      error: ()     => { this.loading = false; }
    });
  }

  color(type: string): string {
    return ({ danger: '#c96a3f', warning: '#e88f68', info: '#7a9e7e' } as any)[type] ?? '#b5aaa5';
  }
  bg(type: string): string {
    return ({ danger: 'rgba(201,106,63,0.06)', warning: 'rgba(232,143,104,0.06)', info: 'rgba(122,158,126,0.06)' } as any)[type] ?? '#faf7f4';
  }
  icon(type: string): string {
    return ({ danger: '🚨', warning: '⚠️', info: '✅' } as any)[type] ?? 'ℹ️';
  }
  get dangerCount()  { return this.alerts.filter(a => a.type === 'danger').length; }
  get warningCount() { return this.alerts.filter(a => a.type === 'warning').length; }
  get infoCount()    { return this.alerts.filter(a => a.type === 'info').length; }
}