import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { DossierService } from '../../services/dossier.service';
import { GoalStateService } from '../../services/goal-state.service';
import { ToastServiceService } from '../../../../../services/toast-service.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface MilestoneResponse {
  id: number;
  label: string;
  targetValue: number;
  reached: boolean;
  reachedDate: string | null;
  note: string | null;
}

interface HealthGoalResponse {
  id: number;
  metric: string;
  direction: string;
  startValue: number;
  targetValue: number;
  unit: string;
  deadline: string;
  active: boolean;
  achieved: boolean;
  achievedDate: string | null;
  createdAt: string;
  paused: boolean;
  pauseReason: string | null;
  assignedByDietitian: boolean;
  assignedByDietitianName: string | null;
  milestones: MilestoneResponse[];
}

interface CustomMilestone { label: string; targetValue: number | null; }

interface GoalTemplate {
  label: string;
  icon: string;
  metric: string;
  unit: string;
  direction: 'decrease' | 'increase' | 'maintain';
  color: string;
}

@Component({
  selector: 'app-goal-tracking',
  templateUrl: './goal-tracking.component.html',
  styleUrls: ['./goal-tracking.component.scss']
})
export class GoalTrackingComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private apiBase = 'http://localhost:8090/peakwell/api/goals';

  goals: HealthGoalResponse[] = [];
  showCreateModal = false;
  hasData = false;
  loading = true;

  // Create form
  selectedTemplate: GoalTemplate | null = null;
  newGoalTarget = 0;
  newGoalDeadline = '';
  createStep: 1 | 2 | 3 = 1;
  customMilestones: CustomMilestone[] = [];
  useCustomMilestones = false;

  // Pause modal
  showPauseModal = false;
  pausingGoalId: number | null = null;
  pauseReason = '';

  // Edit modal
  showEditModal = false;
  editingGoal: HealthGoalResponse | null = null;
  editTarget = 0;
  editDeadline = '';

  // Chart
  expandedChartGoalId: number | null = null;
  private charts = new Map<number, Chart>();

  // Milestone note
  editingNoteId: number | null = null;
  noteText = '';

  readonly templates: GoalTemplate[] = [
    { label: 'Lose Weight',         icon: '⚖️', metric: 'weight',     unit: 'kg',    direction: 'decrease', color: '#c96a3f' },
    { label: 'Gain Weight',         icon: '⚖️', metric: 'weight',     unit: 'kg',    direction: 'increase', color: '#7a9e7e' },
    { label: 'Lower BMI',           icon: '📏', metric: 'bmi',        unit: 'kg/m²', direction: 'decrease', color: '#e88f68' },
    { label: 'Reduce Body Fat',     icon: '🔬', metric: 'bodyFat',    unit: '%',     direction: 'decrease', color: '#e88f68' },
    { label: 'Build Muscle Mass',   icon: '💪', metric: 'muscleMass', unit: 'kg',    direction: 'increase', color: '#7a9e7e' },
    { label: 'Lower Blood Pressure',icon: '❤️', metric: 'systolic',   unit: 'mmHg',  direction: 'decrease', color: '#a47cf0' },
    { label: 'Lower Glucose',       icon: '🩸', metric: 'glucose',    unit: 'mg/dL', direction: 'decrease', color: '#4ab8f0' },
  ];

  constructor(
    private http: HttpClient,
    private dossierService: DossierService,
    private goalState: GoalStateService,
    private toastService: ToastServiceService
  ) {}

  ngOnInit(): void {
    let goalsLoaded = false;
    this.dossierService.entries$.pipe(takeUntil(this.destroy$)).subscribe(entries => {
      this.hasData = entries.length > 0;
      if (this.hasData && !goalsLoaded) {
        goalsLoaded = true;
        this.loadGoals();
      } else if (!this.hasData) {
        this.loading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.charts.forEach(c => c.destroy());
  }

  // ── Data Loading ──────────────────────────────

  loadGoals(): void {
    this.http.get<HealthGoalResponse[]>(this.apiBase).pipe(takeUntil(this.destroy$)).subscribe({
      next: goals => {
        this.goals = goals;
        this.loading = false;
      },
      error: () => {
        this.toastService.show('❌ Failed to load goals');
        this.loading = false;
      }
    });
  }

  // ── Goal Creation ─────────────────────────────

  openCreate(): void {
    this.selectedTemplate = null;
    this.newGoalTarget = 0;
    this.newGoalDeadline = '';
    this.createStep = 1;
    this.customMilestones = [];
    this.useCustomMilestones = false;
    this.showCreateModal = true;
  }

  selectTemplate(template: GoalTemplate): void {
    this.selectedTemplate = template;
    const currentVal = this.getMetricValue(template.metric);
    if (template.direction === 'decrease') this.newGoalTarget = Math.round(currentVal * 0.9 * 10) / 10;
    else if (template.direction === 'increase') this.newGoalTarget = Math.round(currentVal * 1.1 * 10) / 10;
    else this.newGoalTarget = currentVal;
    const d = new Date(); d.setMonth(d.getMonth() + 3);
    this.newGoalDeadline = d.toISOString().split('T')[0];
    this.createStep = 2;
  }

  goToMilestoneStep(): void {
    if (this.newGoalTarget == null || !this.newGoalDeadline) { this.toastService.show('⚠️ Fill in target and deadline'); return; }
    this.customMilestones = [{ label: '', targetValue: null }];
    this.createStep = 3;
  }

  addMilestoneRow(): void { this.customMilestones.push({ label: '', targetValue: null }); }
  removeMilestoneRow(i: number): void { this.customMilestones.splice(i, 1); }

  createGoal(): void {
    if (!this.selectedTemplate || this.newGoalTarget == null || !this.newGoalDeadline) {
      this.toastService.show('⚠️ Please fill in all fields'); return;
    }
    const validCustom = this.customMilestones.filter(m => m.label && m.targetValue != null);
    this.http.post<HealthGoalResponse>(this.apiBase, {
      metric: this.selectedTemplate.metric,
      direction: this.selectedTemplate.direction,
      startValue: this.getMetricValue(this.selectedTemplate.metric),
      targetValue: this.newGoalTarget,
      unit: this.selectedTemplate.unit,
      deadline: this.newGoalDeadline,
      customMilestones: validCustom.length ? validCustom : null,
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (goal) => {
        this.goals.unshift(goal);
        this.showCreateModal = false;
        this.goalState.notify();
        this.toastService.show(`🎯 Goal created: ${this.selectedTemplate!.label}`);
      },
      error: () => this.toastService.show('❌ Failed to create goal')
    });
  }

  deleteGoal(goalId: number): void {
    this.http.delete(`${this.apiBase}/${goalId}`).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.goals = this.goals.filter(g => g.id !== goalId);
        this.goalState.notify();
        this.toastService.show('🗑️ Goal removed');
      },
      error: () => this.toastService.show('❌ Failed to delete goal')
    });
  }

  // ── Pause / Resume ────────────────────────────
  openPause(goalId: number): void { this.pausingGoalId = goalId; this.pauseReason = ''; this.showPauseModal = true; }

  confirmPause(): void {
    if (!this.pausingGoalId) return;
    this.http.patch<HealthGoalResponse>(`${this.apiBase}/${this.pausingGoalId}/pause`, { reason: this.pauseReason }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (g) => { this.replaceGoal(g); this.showPauseModal = false; this.goalState.notify(); this.toastService.show('⏸️ Goal paused'); },
      error: () => this.toastService.show('❌ Failed to pause goal')
    });
  }

  resumeGoal(goalId: number): void {
    this.http.patch<HealthGoalResponse>(`${this.apiBase}/${goalId}/resume`, {}).pipe(takeUntil(this.destroy$)).subscribe({
      next: (g) => { this.replaceGoal(g); this.goalState.notify(); this.toastService.show('▶️ Goal resumed'); },
      error: () => this.toastService.show('❌ Failed to resume goal')
    });
  }

  // ── Edit ──────────────────────────────────────
  openEdit(goal: HealthGoalResponse): void {
    this.editingGoal = goal;
    this.editTarget = goal.targetValue;
    this.editDeadline = goal.deadline;
    this.showEditModal = true;
  }

  confirmEdit(): void {
    if (!this.editingGoal) return;
    this.http.patch<HealthGoalResponse>(`${this.apiBase}/${this.editingGoal.id}/edit`, {
      targetValue: String(this.editTarget), deadline: this.editDeadline
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (g) => { this.replaceGoal(g); this.showEditModal = false; this.goalState.notify(); this.toastService.show('✏️ Goal updated'); },
      error: () => this.toastService.show('❌ Failed to update goal')
    });
  }

  // ── Chart ─────────────────────────────────────
  toggleChart(goal: HealthGoalResponse): void {
    if (this.expandedChartGoalId === goal.id) {
      this.destroyChart(goal.id);
      this.expandedChartGoalId = null;
      return;
    }
    this.expandedChartGoalId = goal.id;
    this.http.get<any>(`${this.apiBase}/${goal.id}/chart-data`).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => setTimeout(() => this.buildChart(goal.id, data, this.getGoalColor(goal)), 50),
      error: () => this.toastService.show('❌ Failed to load chart data')
    });
  }

  private buildChart(goalId: number, data: any, color: string): void {
    this.destroyChart(goalId);
    const canvas = document.getElementById(`goal-chart-${goalId}`) as HTMLCanvasElement;
    if (!canvas) return;
    const labels = data.points.map((p: any) => p.date);
    const values = data.points.map((p: any) => p.value);
    const targetLine = labels.map(() => data.targetValue);
    const chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Actual', data: values, borderColor: color, backgroundColor: color + '18', fill: true, tension: 0.4, pointRadius: 4 },
          { label: 'Target', data: targetLine, borderColor: '#7a9e7e', borderDash: [6, 3], pointRadius: 0, fill: false },
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { font: { size: 10 }, boxWidth: 12 } } },
        scales: {
          x: { grid: { color: '#f0ebe5' }, ticks: { font: { size: 10 }, color: '#b5aaa5' } },
          y: { grid: { color: '#f0ebe5' }, ticks: { font: { size: 10 }, color: '#b5aaa5' } }
        }
      }
    });
    this.charts.set(goalId, chart);
  }

  private destroyChart(goalId: number): void {
    this.charts.get(goalId)?.destroy();
    this.charts.delete(goalId);
  }

  // ── Milestone Note ────────────────────────────
  openNote(milestone: MilestoneResponse): void {
    this.editingNoteId = milestone.id;
    this.noteText = milestone.note ?? '';
  }

  saveNote(milestone: MilestoneResponse): void {
    this.http.patch<MilestoneResponse>(`${this.apiBase}/milestones/${milestone.id}/note`, { note: this.noteText }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (updated) => {
        milestone.note = updated.note;
        this.editingNoteId = null;
        this.toastService.show('📝 Note saved');
      },
      error: () => this.toastService.show('❌ Failed to save note')
    });
  }

  // ── Helpers ───────────────────────────────────
  private replaceGoal(updated: HealthGoalResponse): void {
    const i = this.goals.findIndex(g => g.id === updated.id);
    if (i !== -1) this.goals[i] = updated;
  }

  // ── Progress Calculation ──────────────────────

  getProgress(goal: HealthGoalResponse): number {
    const current = this.getMetricValue(goal.metric);
    const start = goal.startValue;
    const target = goal.targetValue;

    if (start === target) return current === target ? 100 : 0;

    if (goal.direction === 'decrease') {
      if (current <= target) return 100;
      if (current >= start) return 0;
      return Math.round(((start - current) / (start - target)) * 100);
    } else {
      if (current >= target) return 100;
      if (current <= start) return 0;
      return Math.round(((current - start) / (target - start)) * 100);
    }
  }

  getCurrentValue(goal: HealthGoalResponse): number {
    return this.getMetricValue(goal.metric);
  }

  getRemainingValue(goal: HealthGoalResponse): string {
    if (!this.dossierService.latest) return 'No data yet';
    if (this.getProgress(goal) >= 100) return 'Goal reached!';
    const current = this.getMetricValue(goal.metric);
    const diff = Math.abs(Math.round((goal.targetValue - current) * 10) / 10);
    return `${diff} ${goal.unit} to go`;
  }

  getDaysRemaining(goal: HealthGoalResponse): number {
    const now = new Date();
    const deadline = new Date(goal.deadline);
    return Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  }

  getGoalStatus(goal: HealthGoalResponse): { label: string; color: string } {
    if (goal.achieved) return { label: 'Achieved!', color: '#7a9e7e' };
    if (goal.paused)   return { label: 'Paused',    color: '#b5aaa5' };
    const progress = this.getProgress(goal);
    const daysLeft = this.getDaysRemaining(goal);
    if (daysLeft === 0) return { label: 'Expired', color: '#b5aaa5' };
    if (progress >= 75) return { label: 'Almost there', color: '#7a9e7e' };
    if (progress >= 40) return { label: 'On track', color: '#e88f68' };
    return { label: 'Needs effort', color: '#c96a3f' };
  }

  getGoalColor(goal: HealthGoalResponse): string {
    const template = this.templates.find(t => t.metric === goal.metric && t.direction === goal.direction);
    return template?.color ?? '#c96a3f';
  }

  getGoalIcon(goal: HealthGoalResponse): string {
    const template = this.templates.find(t => t.metric === goal.metric);
    return template?.icon ?? '🎯';
  }

  getMetricLabel(metric: string): string {
    const map: Record<string, string> = {
      weight: 'Weight', bmi: 'BMI', bodyFat: 'Body Fat',
      muscleMass: 'Muscle Mass', systolic: 'Systolic BP', glucose: 'Glucose'
    };
    return map[metric] ?? metric;
  }

  // ── Recommendation logic ──────────────────────

  isRecommended(template: GoalTemplate): boolean {
    const latest = this.dossierService.latest;
    if (!latest) return false;

    const bmi        = latest.bmi        ?? 0;
    const bodyFat    = latest.bodyFat    ?? 0;
    const systolic   = latest.systolic   ?? 0;
    const glucose    = latest.glucose    ?? 0;
    const muscleMass = latest.muscleMass ?? 0;
    const weight     = latest.weight     ?? 0;

    switch (template.metric) {
      case 'weight':
        // Lose weight: overweight or obese
        if (template.direction === 'decrease') return bmi >= 25;
        // Gain weight: underweight
        if (template.direction === 'increase') return bmi > 0 && bmi < 18.5;
        return false;

      case 'bmi':
        return bmi >= 25;

      case 'bodyFat':
        // >25% for male, >32% for female
        if (!bodyFat) return false;
        const gender = (this.dossierService.profile?.gender ?? '').toLowerCase();
        return gender === 'male' ? bodyFat > 25 : bodyFat > 32;

      case 'muscleMass':
        // Low muscle relative to body weight (<30% of body weight is a rough flag)
        if (!muscleMass || !weight) return false;
        return (muscleMass / weight) < 0.30;

      case 'systolic':
        return systolic > 130;

      case 'glucose':
        return glucose > 100;

      default:
        return false;
    }
  }

  hasActiveGoal(template: GoalTemplate): boolean {
    return this.goals.some(g =>
      g.active && !g.achieved &&
      g.metric === template.metric &&
      g.direction === template.direction
    );
  }

  get recommendedCount(): number {
    return this.templates.filter(t => this.isRecommended(t) && !this.hasActiveGoal(t)).length;
  }

  // ── Helpers ───────────────────────────────────

  private getMetricValue(metric: string): number {
    const latest = this.dossierService.latest;
    if (!latest) return 0;
    const map: Record<string, number> = {
      weight: latest.weight ?? 0,
      bmi: latest.bmi ?? 0,
      bodyFat: latest.bodyFat ?? 0,
      muscleMass: latest.muscleMass ?? 0,
      systolic: latest.systolic ?? 0,
      glucose: latest.glucose ?? 0,
    };
    return map[metric] ?? 0;
  }
}