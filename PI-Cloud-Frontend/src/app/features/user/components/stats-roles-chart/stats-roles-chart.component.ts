import { Component, Input, OnChanges } from '@angular/core';
import { RoleStat } from '../../pages/admin-stats-page/admin-stats-page.component';

const ROLE_COLORS: Record<string, { accent: string; bg: string }> = {
  DIETITIAN: { accent: '#5b6abf', bg: 'rgba(91,106,191,0.12)' },
  STUDENT:   { accent: '#c96a3f', bg: 'rgba(201,106,63,0.10)' },
  ADMIN:     { accent: '#4a7c59', bg: 'rgba(122,158,126,0.12)' },
  DEFAULT:   { accent: '#b07d3f', bg: 'rgba(176,125,63,0.10)' }
};

@Component({
  selector: 'app-stats-roles-chart',
  templateUrl: './stats-roles-chart.component.html',
  styleUrl: './stats-roles-chart.component.scss'
})
export class StatsRolesChartComponent implements OnChanges {
  @Input() data: RoleStat[] = [];

  total = 0;
  segments: { role: string; count: number; pct: number; accent: string; bg: string; offset: number }[] = [];

  // SVG donut config
  readonly cx = 80;
  readonly cy = 80;
  readonly r  = 58;
  readonly stroke = 22;

  get circumference() { return 2 * Math.PI * this.r; }

  ngOnChanges(): void {
    this.total = this.data.reduce((s, r) => s + r.count, 0);
    let offset = 0;

    this.segments = this.data.map(r => {
      const pct     = this.total ? r.count / this.total : 0;
      const colors  = ROLE_COLORS[r.role] ?? ROLE_COLORS['DEFAULT'];
      const seg     = { ...r, pct, ...colors, offset };
      offset += pct * this.circumference;
      return seg;
    });
  }

  dashArray(pct: number) {
    const arc = pct * this.circumference;
    return `${arc} ${this.circumference - arc}`;
  }

  // rotate so segments start at top
  rotate(offset: number) {
    return `rotate(${(offset / this.circumference) * 360 - 90} ${this.cx} ${this.cy})`;
  }

  colorOf(role: string) { return (ROLE_COLORS[role] ?? ROLE_COLORS['DEFAULT']).accent; }
  bgOf(role: string)    { return (ROLE_COLORS[role] ?? ROLE_COLORS['DEFAULT']).bg; }
}