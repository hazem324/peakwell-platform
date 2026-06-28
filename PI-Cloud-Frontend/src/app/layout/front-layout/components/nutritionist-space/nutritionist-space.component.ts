import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-nutritionist-space',
  templateUrl: './nutritionist-space.component.html',
  styleUrls: ['./nutritionist-space.component.scss']
})
export class NutritionistSpaceComponent implements OnInit {
  private base = 'http://localhost:8090/peakwell/api';

  totalPatients   = 0;
  criticalCount   = 0;
  actionItemCount = 0;
  statsLoaded     = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<any>(`${this.base}/heatmap`).subscribe({
      next: d => {
        this.totalPatients   = d.overallStats?.totalPatients   ?? 0;
        this.criticalCount   = d.quadrantSummary?.critical     ?? 0;
        this.actionItemCount = d.actionItems?.length           ?? 0;
        this.statsLoaded     = true;
      }
    });
  }
}
