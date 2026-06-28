import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastServiceService } from '../../../../../services/toast-service.service';

interface TimelineEvent {
  id: string;
  date: string;
  type: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  severity: string;
  data: Record<string, any>;
}

interface TimelineResponse {
  events: TimelineEvent[];
  totalEvents: number;
  eventCounts: Record<string, number>;
  dateRange: string;
}

@Component({
  selector: 'app-health-timeline',
  templateUrl: './health-timeline.component.html',
  styleUrls: ['./health-timeline.component.scss']
})
export class HealthTimelineComponent implements OnInit {
  private apiBase = 'http://localhost:8090/peakwell/api/timeline';

  response: TimelineResponse | null = null;
  filteredEvents: TimelineEvent[] = [];
  loading = true;
  activeFilter = 'all';
  expandedId: string | null = null;

  filters = [
    { value: 'all',       label: 'All Events',   icon: '📋' },
    { value: 'biometric', label: 'Biometrics',    icon: '📊' },
    { value: 'symptom',   label: 'Symptoms',      icon: '🩺' },
    { value: 'goal',      label: 'Goals',         icon: '🎯' },
    { value: 'alert',     label: 'Alerts',        icon: '⚠️' },
    { value: 'milestone', label: 'Milestones',    icon: '🏆' },
  ];

  constructor(private http: HttpClient, private toastService: ToastServiceService) {}

  ngOnInit(): void {
    this.loadTimeline();
  }

  loadTimeline(): void {
    this.loading = true;
    this.http.get<TimelineResponse>(this.apiBase).subscribe({
      next: res => {
        this.response = res;
        this.applyFilter();
        this.loading = false;
      },
      error: () => {
        this.toastService.show('❌ Failed to load timeline');
        this.loading = false;
      }
    });
  }

  setFilter(filter: string): void {
    this.activeFilter = filter;
    this.applyFilter();
  }

  applyFilter(): void {
    if (!this.response) return;
    if (this.activeFilter === 'all') {
      this.filteredEvents = this.response.events;
    } else {
      this.filteredEvents = this.response.events.filter(e => e.type === this.activeFilter);
    }
  }

  toggleExpand(id: string): void {
    this.expandedId = this.expandedId === id ? null : id;
  }

  // ── Display helpers ───────────────────────────

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  formatTime(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  getDateLabel(event: TimelineEvent, index: number): string | null {
    const date = this.formatDate(event.date);
    if (index === 0) return date;
    const prevDate = this.formatDate(this.filteredEvents[index - 1].date);
    return date !== prevDate ? date : null;
  }

  typeLabel(type: string): string {
    const map: Record<string, string> = {
      biometric: 'Biometric', symptom: 'Symptom', goal: 'Goal',
      alert: 'Alert', milestone: 'Milestone'
    };
    return map[type] ?? type;
  }

  sevBg(severity: string): string {
    const map: Record<string, string> = {
      info: 'rgba(74,184,240,0.08)', success: 'rgba(122,158,126,0.08)',
      warning: 'rgba(232,143,104,0.08)', danger: 'rgba(201,106,63,0.08)'
    };
    return map[severity] ?? '#faf7f4';
  }

  getCount(type: string): number {
    return this.response?.eventCounts?.[type] ?? 0;
  }

  get totalCount(): number {
    return this.response?.totalEvents ?? 0;
  }

  hasData(event: TimelineEvent, key: string): boolean {
    return event.data && event.data[key] !== undefined && event.data[key] !== null;
  }
}