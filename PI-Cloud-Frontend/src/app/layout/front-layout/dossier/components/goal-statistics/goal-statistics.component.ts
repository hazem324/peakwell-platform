import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { GoalStateService } from '../../services/goal-state.service';

@Component({
  selector: 'app-goal-statistics',
  templateUrl: './goal-statistics.component.html',
  styleUrls: ['./goal-statistics.component.scss']
})
export class GoalStatisticsComponent implements OnInit, OnDestroy {
  private api = 'http://localhost:8090/peakwell/api/goals/statistics';
  private destroy$ = new Subject<void>();

  loading = true;
  stats: any = null;
  error = '';

  constructor(private http: HttpClient, private goalState: GoalStateService) {}

  ngOnInit(): void {
    this.loadStats();
    this.goalState.changed$.pipe(takeUntil(this.destroy$)).subscribe(() => this.loadStats());
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  private loadStats(): void {
    this.loading = true;
    this.error = '';
    this.http.get<any>(this.api).subscribe({
      next: data => { this.stats = data; this.loading = false; },
      error: () => { this.error = 'Failed to load statistics'; this.loading = false; }
    });
  }

  // Helper: completion rate color
  rateColor(rate: number): string {
    if (rate >= 75) return '#7a9e7e';
    if (rate >= 50) return '#e8b84b';
    if (rate >= 25) return '#e88f68';
    return '#c96a3f';
  }

  // Helper: progress color
  progressColor(pct: number): string {
    if (pct >= 100) return '#7a9e7e';
    if (pct >= 75) return '#a8c5ac';
    if (pct >= 40) return '#e8b84b';
    return '#c96a3f';
  }

  // Helper: status badge color
  statusColor(status: string): string {
    const m: Record<string, string> = {
      'Achieved': '#7a9e7e', 'Almost there': '#a8c5ac',
      'On track': '#4ab8f0', 'Needs effort': '#e88f68',
      'Overdue': '#c96a3f', 'Just started': '#b5aaa5', 'No data': '#b5aaa5'
    };
    return m[status] ?? '#b5aaa5';
  }

  // Format metric label
  metricLabel(metric: string): string {
    const m: Record<string, string> = {
      'weight': 'Weight', 'bmi': 'BMI', 'bodyFat': 'Body Fat',
      'muscleMass': 'Muscle Mass', 'systolic': 'Blood Pressure', 'glucose': 'Glucose'
    };
    return m[metric] ?? metric;
  }

  // Format days
  formatDays(days: number): string {
    if (days === 0) return 'Today';
    if (days === 1) return '1 day';
    if (days < 30) return `${days} days`;
    if (days < 60) return '1 month';
    return `${Math.round(days / 30)} months`;
  }
}