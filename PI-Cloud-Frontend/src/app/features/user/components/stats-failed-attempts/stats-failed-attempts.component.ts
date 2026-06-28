import { Component, Input, OnChanges } from '@angular/core';
import { FailedAttemptsStat } from '../../pages/admin-stats-page/admin-stats-page.component';

@Component({
  selector: 'app-stats-failed-attempts',
  templateUrl: './stats-failed-attempts.component.html',
  styleUrl: './stats-failed-attempts.component.scss'
})
export class StatsFailedAttemptsComponent implements OnChanges {
  @Input() data!: FailedAttemptsStat;

  total = 0;
  bands: { label: string; count: number; pct: number; accent: string; bg: string }[] = [];

  ngOnChanges(): void {
    if (!this.data) return;
    this.total = this.data.zeroToOne + this.data.twoToFour + this.data.moreThanFour;

    this.bands = [
      {
        label: '0 – 1 attempts',
        count: this.data.zeroToOne,
        pct:   this.total ? this.data.zeroToOne / this.total : 0,
        accent: '#4a7c59',
        bg:    'rgba(122,158,126,0.1)'
      },
      {
        label: '2 – 4 attempts',
        count: this.data.twoToFour,
        pct:   this.total ? this.data.twoToFour / this.total : 0,
        accent: '#b07d3f',
        bg:    'rgba(176,125,63,0.08)'
      },
      {
        label: '5 + attempts',
        count: this.data.moreThanFour,
        pct:   this.total ? this.data.moreThanFour / this.total : 0,
        accent: '#c96a3f',
        bg:    'rgba(201,106,63,0.08)'
      }
    ];
  }
}