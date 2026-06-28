import { Component, Input, OnChanges } from '@angular/core';
import { ActivitySummary } from '../../../../services/user-activity.service';


@Component({
  selector: 'app-activity-summary-cards',
  templateUrl: './activity-summary-cards.component.html',
  styleUrl: './activity-summary-cards.component.scss'
})
export class ActivitySummaryCardsComponent implements OnChanges {
  @Input() data!: ActivitySummary;
 
  cards: { label: string; value: string; icon: string; accent: string; iconBg: string; pct: number }[] = [];
 
  ngOnChanges(): void {
    if (!this.data) return;
 
    const rate = this.data.successRate ?? 0;
 
    this.cards = [
      {
        label:   'Total Events',
        value:   this.data.total.toLocaleString(),
        icon:    'fa-solid fa-bolt',
        accent:  '#c96a3f',
        iconBg:  'rgba(201,106,63,0.08)',
        pct:     100
      },
      {
        label:   'Successful',
        value:   this.data.success.toLocaleString(),
        icon:    'fa-solid fa-circle-check',
        accent:  '#4a7c59',
        iconBg:  'rgba(74,124,89,0.08)',
        pct:     rate
      },
      {
        label:   'Failed',
        value:   this.data.failed.toLocaleString(),
        icon:    'fa-solid fa-circle-xmark',
        accent:  '#b94040',
        iconBg:  'rgba(185,64,64,0.08)',
        pct:     100 - rate
      },
      {
        label:   'Success Rate',
        value:   rate.toFixed(1) + '%',
        icon:    'fa-solid fa-chart-pie',
        accent:  '#b07d3f',
        iconBg:  'rgba(176,125,63,0.08)',
        pct:     rate
      }
    ];
  }
}