import { Component, Input, OnInit } from '@angular/core';
import { DossierDataService } from '../../services/dossier-data.service';
import { HealthAlert } from '../../models/dossier.models';

@Component({
  selector: 'app-alerts-panel',
  templateUrl: './alerts-panel.component.html',
  styleUrls: ['./alerts-panel.component.scss']
})
export class AlertsPanelComponent implements OnInit {
  @Input() clientId!: number;
  alerts: HealthAlert[] = [];

  constructor(private dossierService: DossierDataService) {}

  ngOnInit(): void {
    this.alerts = this.dossierService.getAlerts(this.clientId);
  }

  alertColor(type: string): string {
    const map: Record<string, string> = { danger: '#c96a3f', warning: '#e88f68', info: '#7a9e7e' };
    return map[type] ?? '#b5aaa5';
  }

  alertIcon(type: string): string {
    const map: Record<string, string> = { danger: '🚨', warning: '⚠️', info: '✅' };
    return map[type] ?? 'ℹ️';
  }

  alertBg(type: string): string {
    const map: Record<string, string> = {
      danger: 'rgba(201,106,63,0.07)', warning: 'rgba(232,143,104,0.07)', info: 'rgba(122,158,126,0.07)'
    };
    return map[type] ?? '#faf7f4';
  }
  get dangerCount(): number  { return this.alerts.filter(a => a.type === 'danger').length; }
  get warningCount(): number { return this.alerts.filter(a => a.type === 'warning').length; }
  get infoCount(): number    { return this.alerts.filter(a => a.type === 'info').length; }
}