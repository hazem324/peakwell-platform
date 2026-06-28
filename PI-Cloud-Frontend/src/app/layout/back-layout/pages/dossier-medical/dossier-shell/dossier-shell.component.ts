import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DossierDataService } from '../services/dossier-data.service';
import { DossierClient } from '../models/dossier.models';
import { ToastServiceService } from '../../../../../services/toast-service.service';

@Component({
  selector: 'app-dossier-shell',
  templateUrl: './dossier-shell.component.html',
  styleUrls: ['./dossier-shell.component.scss']
})
export class DossierShellComponent implements OnInit {
  client: DossierClient | undefined;
  activeTab = 'dashboard';
  tabs = [
    { value: 'dashboard',  label: '📊 Dashboard'         },
    { value: 'biometrics', label: '📏 Biometric History'  },
    { value: 'charts',     label: '📈 Charts & Trends'    },
    { value: 'alerts',     label: '⚠️ Alerts'             },
    { value: 'notes',      label: '📝 Consultation Notes' },
    { value: 'goals',      label: '🎯 Goals'              },
    { value: 'add',        label: '➕ Add Entry'           },
  ];

  // Goals for this client
  clientGoals: any[] = [];
  goalsLoading = false;
  showGoalModal = false;
  goalTemplates = [
    { label: 'Lose Weight',          metric: 'weight',     unit: 'kg',    direction: 'decrease' },
    { label: 'Gain Weight',          metric: 'weight',     unit: 'kg',    direction: 'increase' },
    { label: 'Reduce Body Fat',      metric: 'bodyFat',    unit: '%',     direction: 'decrease' },
    { label: 'Build Muscle Mass',    metric: 'muscleMass', unit: 'kg',    direction: 'increase' },
    { label: 'Lower Blood Pressure', metric: 'systolic',   unit: 'mmHg',  direction: 'decrease' },
    { label: 'Lower Glucose',        metric: 'glucose',    unit: 'mg/dL', direction: 'decrease' },
  ];
  selectedGoalTemplate: any = null;
  newGoalTarget = 0;
  newGoalDeadline = '';
  private apiBase = 'http://localhost:8090/peakwell/api/goals';

  private readonly avatarColors = [
    '#fde8d8','#e8f0dd','#fff3e0','#fce4ec','#e8eaf6','#f9fbe7','#e0f7fa'
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private dossierService: DossierDataService,
    public toastService: ToastServiceService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.client = this.dossierService.getClient(id);
    if (!this.client) {
      // Real student from backend — fetch and build DossierClient
      this.http.get<any>(`http://localhost:8090/peakwell/student/${id}`).subscribe({
        next: s => { this.client = this.buildClient(s); },
        error: () => this.router.navigate(['/admin/clients'])
      });
    }
  }

  private buildClient(s: any): DossierClient {
    const name = `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim() || 'Student';
    const initials = ((s.firstName?.[0] ?? '') + (s.lastName?.[0] ?? '')).toUpperCase() || '?';
    return {
      id: s.id,
      name,
      initials,
      avatarColor: this.avatarColors[s.id % this.avatarColors.length],
      dob: '—',
      age: s.age ?? 0,
      gender: '—',
      goal: s.goal ?? '—',
      assignedNutritionist: '—',
      memberSince: '—',
      bloodType: '—',
      allergies: [],
      conditions: [],
    };
  }

  loadGoals(): void {
    if (!this.client) return;
    this.goalsLoading = true;
    this.http.get<any[]>(`${this.apiBase}/profile/${this.client.id}`).subscribe({
      next: g => { this.clientGoals = g; this.goalsLoading = false; },
      error: () => { this.goalsLoading = false; }
    });
  }

  onTabChange(tab: string): void {
    this.activeTab = tab;
    if (tab === 'goals' && this.clientGoals.length === 0) this.loadGoals();
  }

  openGoalModal(): void {
    this.selectedGoalTemplate = null;
    this.newGoalTarget = 0;
    const d = new Date(); d.setMonth(d.getMonth() + 3);
    this.newGoalDeadline = d.toISOString().split('T')[0];
    this.showGoalModal = true;
  }

  createGoalForClient(): void {
    if (!this.selectedGoalTemplate || !this.newGoalTarget || !this.newGoalDeadline || !this.client) return;
    const profileId = this.client.id;
    const payload = {
      metric: this.selectedGoalTemplate.metric,
      direction: this.selectedGoalTemplate.direction,
      startValue: 0,
      targetValue: this.newGoalTarget,
      unit: this.selectedGoalTemplate.unit,
      deadline: this.newGoalDeadline,
    };
    this.http.post<any>(`${this.apiBase}/profile/${profileId}?dietitianName=Nutritionist`, payload).subscribe({
      next: (g) => { this.clientGoals.unshift(g); this.showGoalModal = false; this.toastService.show('🎯 Goal assigned to client'); },
      error: () => this.toastService.show('❌ Failed to create goal')
    });
  }

  getGoalProgress(goal: any): number {
    const current = goal.startValue;
    if (goal.direction === 'decrease') {
      if (current <= goal.targetValue) return 100;
      if (current >= goal.startValue) return 0;
      return Math.round(((goal.startValue - current) / (goal.startValue - goal.targetValue)) * 100);
    }
    return 0;
  }

  exportPDF(): void {
    this.toastService.show('📄 Generating PDF report…');
  }

  printDossier(): void {
    this.toastService.show('🖨️ Preparing print view…');
  }

  goBack(): void {
    this.router.navigate(['/admin/clients']);
  }
  getEntries() {
  return this.dossierService.getBiometrics(this.client!.id);
}

  getBMIColor(bmi: number): string {
    return this.dossierService.getBMICategory(bmi).color;
}
}