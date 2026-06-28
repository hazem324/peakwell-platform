import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-health-heatmap',
  templateUrl: './health-heatmap.component.html',
  styleUrls: ['./health-heatmap.component.scss']
})
export class HealthHeatmapComponent implements OnInit {
  private api = 'http://localhost:8090/peakwell/api/heatmap';

  loading = true;
  data: any = null;
  hoveredPatient: any = null;
  selectedPatient: any = null;
  actionFilter = 'ALL';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.http.get<any>(this.api).subscribe({
      next: d => { this.data = d; this.loading = false; },
      error: () => this.loading = false
    });
  }

  // Map 0-100 score to pixel position (grid is 400x400)
  xPos(patient: any): number { return (patient.healthScore / 100) * 380 + 10; }
  yPos(patient: any): number { return 390 - (patient.engagementScore / 100) * 380; }
  bubbleR(patient: any): number { return Math.max(8, Math.min(patient.bubbleSize * 1.8 + 6, 28)); }

  // Quadrant label
  quadrantLabel(q: string): string {
    const m: Record<string, string> = {
      star: '⭐ Star Patient', at_risk_churn: '📉 Churn Risk',
      needs_plan_change: '🔄 Needs Plan Change', critical: '🚨 Critical'
    };
    return m[q] ?? q;
  }

  quadrantColor(q: string): string {
    const m: Record<string, string> = {
      star: '#7a9e7e', at_risk_churn: '#e8b84b',
      needs_plan_change: '#e88f68', critical: '#c96a3f'
    };
    return m[q] ?? '#b5aaa5';
  }

  priorityColor(p: string): string {
    const m: Record<string, string> = {
      URGENT: '#c96a3f', HIGH: '#e88f68', MEDIUM: '#e8b84b', LOW: '#7a9e7e'
    };
    return m[p] ?? '#b5aaa5';
  }

  get filteredActions(): any[] {
    if (!this.data?.actionItems) return [];
    if (this.actionFilter === 'ALL') return this.data.actionItems;
    return this.data.actionItems.filter((a: any) => a.priority === this.actionFilter);
  }

  actionTypeCount(priority: string): number {
    return this.data?.actionItems?.filter((a: any) => a.priority === priority).length ?? 0;
  }

  openDossier(profileId: number): void {
    this.router.navigate(['/admin/dossier', profileId]);
  }

  selectPatient(p: any): void { this.selectedPatient = p; }
  clearSelection(): void { this.selectedPatient = null; }
}