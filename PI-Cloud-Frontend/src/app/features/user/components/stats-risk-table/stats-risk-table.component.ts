import { Component, Input } from '@angular/core';
import { RiskUser } from '../../pages/admin-stats-page/admin-stats-page.component';

@Component({
  selector: 'app-stats-risk-table',
  templateUrl: './stats-risk-table.component.html',
  styleUrl: './stats-risk-table.component.scss'
})
export class StatsRiskTableComponent {
  @Input() data: RiskUser[] = [];

  riskLevel(attempts: number): { label: string; accent: string; bg: string } {
    if (attempts === 0)  return { label: 'Safe',     accent: '#4a7c59', bg: 'rgba(122,158,126,0.1)' };
    if (attempts <= 4)   return { label: 'Moderate', accent: '#b07d3f', bg: 'rgba(176,125,63,0.08)' };
    return                      { label: 'High',     accent: '#c96a3f', bg: 'rgba(201,106,63,0.08)' };
  }
}