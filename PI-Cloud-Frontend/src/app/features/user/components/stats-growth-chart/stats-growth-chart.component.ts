import { Component, Input, OnChanges } from '@angular/core';
import { GrowthStat } from '../../pages/admin-stats-page/admin-stats-page.component';

@Component({
  selector: 'app-stats-growth-chart',
  templateUrl: './stats-growth-chart.component.html',
  styleUrl: './stats-growth-chart.component.scss'
})
export class StatsGrowthChartComponent implements OnChanges {
  @Input() data: GrowthStat[] = [];

  readonly W = 600;
  readonly H = 140;
  readonly padX = 40;
  readonly padY = 20;

  max    = 0;
  points = '';
  fill   = '';
  bars: { x: number; y: number; height: number; count: number; date: string }[] = [];

  ngOnChanges(): void {
    if (!this.data.length) return;

    this.max = Math.max(...this.data.map(d => d.count), 1);

    const slotW = (this.W - this.padX * 2) / this.data.length;
    const barW  = Math.min(slotW * 0.5, 36);

    this.bars = this.data.map((d, i) => {
      const barH = ((d.count / this.max) * (this.H - this.padY * 2));
      const x    = this.padX + slotW * i + slotW / 2 - barW / 2;
      const y    = this.H - this.padY - barH;
      return { x, y, height: barH, count: d.count, date: d.date };
    });
  }

  formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  }
}