import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-nutritionist-heatmap',
  templateUrl: './nutritionist-heatmap.component.html',
  styleUrls: ['./nutritionist-heatmap.component.scss']
})
export class NutritionistHeatmapComponent implements OnInit {
  private base = 'http://localhost:8090/peakwell/api/heatmap';

  loading        = true;
  data:          any = null;
  hoveredPatient: any = null;
  actionFilter   = 'ALL';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.http.get<any>(this.base).subscribe({
      next: d  => { this.data = d; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  xPos(p: any): number { return (p.healthScore / 100) * 440 + 20; }
  yPos(p: any): number { return 340 - (p.engagementScore / 100) * 330; }
  bubbleR(p: any): number { return Math.max(7, Math.min(p.bubbleSize * 1.0 + 6, 12)); }

  quadrantLabel(q: string): string {
    return ({ star: '⭐ Star Patient', at_risk_churn: '📉 Churn Risk',
              needs_plan_change: '🔄 Plan Change', critical: '🚨 Critical' } as any)[q] ?? q;
  }
  quadrantColor(q: string): string {
    return ({ star: '#7a9e7e', at_risk_churn: '#e8b84b',
              needs_plan_change: '#e88f68', critical: '#c96a3f' } as any)[q] ?? '#b5aaa5';
  }
  priorityColor(p: string): string {
    return ({ URGENT: '#c96a3f', HIGH: '#e88f68', MEDIUM: '#e8b84b', LOW: '#7a9e7e' } as any)[p] ?? '#b5aaa5';
  }

  get filteredActions(): any[] {
    if (!this.data?.actionItems) return [];
    return this.actionFilter === 'ALL'
      ? this.data.actionItems
      : this.data.actionItems.filter((a: any) => a.priority === this.actionFilter);
  }
  actionCount(p: string): number {
    return this.data?.actionItems?.filter((a: any) => a.priority === p).length ?? 0;
  }

  openDossier(patient: any): void {
    const id = patient.studentId ?? patient.profileId;
    this.router.navigate(['/nutritionist/dossier', id], { state: { patientId: id } });
  }
}
