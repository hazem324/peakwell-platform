import { Component, Input } from '@angular/core';
import { GlobalStats } from '../../pages/admin-stats-page/admin-stats-page.component';


@Component({
  selector: 'app-stats-kpi-cards',
  templateUrl: './stats-kpi-cards.component.html',
  styleUrl: './stats-kpi-cards.component.scss'
})
export class StatsKpiCardsComponent {
  @Input() data!: GlobalStats;

  cards() {
    return [
      {
        label: 'Total Users',
        value: this.data.totalUsers,
        icon: 'fa-solid fa-users',
        accent: '#5b6abf',
        bg: 'rgba(91,106,191,0.08)'
      },
      {
        label: 'Active Users',
        value: this.data.activeUsers,
        icon: 'fa-solid fa-circle-check',
        accent: '#4a7c59',
        bg: 'rgba(122,158,126,0.1)'
      },
      {
        label: 'Locked Accounts',
        value: this.data.lockedUsers,
        icon: 'fa-solid fa-lock',
        accent: '#c96a3f',
        bg: 'rgba(201,106,63,0.08)'
      },
      {
        label: 'Profile Completion',
        value: this.data.profileCompletionRate.toFixed(1) + '%',
        icon: 'fa-solid fa-id-card',
        accent: '#b07d3f',
        bg: 'rgba(176,125,63,0.08)'
      }
    ];
  }
}
