import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from '../../../../services/notification.service';

@Component({
  selector: 'app-nutritionist-dossier',
  templateUrl: './nutritionist-dossier.component.html',
  styleUrls: ['./nutritionist-dossier.component.scss']
})
export class NutritionistDossierComponent implements OnInit {
  private base = 'http://localhost:8090/peakwell/api';

  loading         = true;
  profile: any    = null;
  biometrics: any[] = [];
  activeTab       = 'profile';

  tabs = [
    { value: 'profile',    label: 'Medical Profile' },
    { value: 'biometrics', label: 'Biometrics'       },
    { value: 'goals',      label: 'Goals'         },
  ];

  // ── Goals ─────────────────────────────────────
  goals: any[]      = [];
  goalsLoading      = false;
  showGoalModal     = false;
  selectedTemplate: any = null;
  newGoalTarget     = 0;
  newGoalDeadline   = '';

  readonly goalTemplates = [
    { label: 'Lose Weight',          metric: 'weight',     unit: 'kg',    direction: 'decrease' },
    { label: 'Gain Weight',          metric: 'weight',     unit: 'kg',    direction: 'increase' },
    { label: 'Reduce Body Fat',      metric: 'bodyFat',    unit: '%',     direction: 'decrease' },
    { label: 'Build Muscle Mass',    metric: 'muscleMass', unit: 'kg',    direction: 'increase' },
    { label: 'Lower Blood Pressure', metric: 'systolic',   unit: 'mmHg',  direction: 'decrease' },
    { label: 'Lower Glucose',        metric: 'glucose',    unit: 'mg/dL', direction: 'decrease' },
  ];

  private statePatientId: number | null = null;
  patientImageUrl: string | null = null;

  private readonly goalColors: Record<string, string> = {
    weight_decrease: '#c96a3f', weight_increase: '#7a9e7e',
    bmi_decrease: '#e88f68', bodyFat_decrease: '#e88f68',
    muscleMass_increase: '#7a9e7e', systolic_decrease: '#a47cf0', glucose_decrease: '#4ab8f0',
  };

  readonly goalIcons: Record<string, string | undefined> = {
    weight: '⚖️', bmi: '📏', bodyFat: '🔬', muscleMass: '💪', systolic: '❤️', glucose: '🩸',
  };

  constructor(
    private route:  ActivatedRoute,
    private router: Router,
    private http:   HttpClient,
    private notifService: NotificationService
  ) {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state;
    this.profile           = state?.['profile']   ?? null;
    this.statePatientId    = state?.['patientId'] ?? null;
    this.patientImageUrl   = state?.['imageUrl']  ?? null;
  }

  ngOnInit(): void {
    const routeId = Number(this.route.snapshot.paramMap.get('id'));

    if (this.profile) {
      // Profile came from router state (profiles page) — profile.id is the medical profile ID
      this.loading = false;
      this.fetchBiometrics(this.profile.id);
    } else {
      // No profile in state — fetch all profiles and find by studentId (user account ID)
      const studentId = this.statePatientId ?? routeId;
      this.http.get<any[]>(`${this.base}/profile/all`).subscribe({
        next: list => {
          this.profile = list.find(p => p.studentId === studentId) ?? null;
          this.loading = false;
          if (this.profile) {
            this.fetchBiometrics(this.profile.id);
          }
        },
        error: () => { this.loading = false; }
      });
    }
  }

  private fetchBiometrics(profileId: number): void {
    this.http.get<any[]>(`${this.base}/biometrics/profile/${profileId}`).subscribe({
      next: b  => { this.biometrics = b; },
      error: () => { this.biometrics = []; }
    });
  }

  onTabChange(tab: string): void {
    this.activeTab = tab;
    if (tab === 'goals' && this.goals.length === 0) this.loadGoals();
  }

  loadGoals(): void {
    if (!this.profile?.id) return;
    this.goalsLoading = true;
    this.http.get<any[]>(`${this.base}/goals/profile/${this.profile.id}`).subscribe({
      next:  g  => { this.goals = g; this.goalsLoading = false; },
      error: () => { this.goalsLoading = false; }
    });
  }

  hasActiveGoal(template: { metric: string; direction: string }): boolean {
    return this.goals.some(g =>
      g.active && !g.achieved &&
      g.metric === template.metric &&
      g.direction === template.direction
    );
  }

  openGoalModal(): void {
    this.selectedTemplate = null;
    this.newGoalTarget    = 0;
    const d = new Date(); d.setMonth(d.getMonth() + 3);
    this.newGoalDeadline  = d.toISOString().split('T')[0];
    this.showGoalModal    = true;
  }

  getLatestMetricValue(metric: string): number {
    const l = this.latest;
    if (!l) return 0;
    const map: Record<string, number> = {
      weight: l.weight ?? 0,
      bmi: l.bmi ?? 0,
      bodyFat: l.bodyFat ?? 0,
      muscleMass: l.muscleMass ?? 0,
      systolic: l.systolic ?? 0,
      glucose: l.glucose ?? 0,
    };
    return map[metric] ?? 0;
  }

  assignGoal(): void {
    if (!this.selectedTemplate || !this.newGoalTarget || !this.newGoalDeadline) return;
    const payload = {
      metric:      this.selectedTemplate.metric,
      direction:   this.selectedTemplate.direction,
      startValue:  this.getLatestMetricValue(this.selectedTemplate.metric),
      targetValue: this.newGoalTarget,
      unit:        this.selectedTemplate.unit,
      deadline:    this.newGoalDeadline,
    };
    this.http.post<any>(
      `${this.base}/goals/profile/${this.profile.id}`, payload
    ).subscribe({
      next: g => {
        this.goals.unshift(g);
        this.showGoalModal = false;
        const label = this.selectedTemplate?.label ?? 'Health Goal';
        const studentId = this.statePatientId ?? this.profile?.studentId;
        if (studentId) {
          this.notifService.sendGoalNotification(studentId, label).subscribe({
            error: () => {
              // fallback: trigger backend check for this profile
              this.notifService.triggerCheckForProfile(this.profile.id).subscribe();
            }
          });
        }
      },
      error: () => {}
    });
  }

  goalStatusLabel(g: any): string {
    if (g.achieved) return 'Achieved';
    if (g.paused)   return 'Paused';
    const p = this.goalProgress(g);
    const days = this.goalDaysLeft(g);
    if (days === 0) return 'Expired';
    if (p >= 75) return 'Almost there';
    if (p >= 40) return 'On track';
    return 'Needs effort';
  }

  goalStatusColor(g: any): string {
    if (g.achieved) return '#7a9e7e';
    if (g.paused)   return '#b5aaa5';
    const p = this.goalProgress(g);
    const days = this.goalDaysLeft(g);
    if (days === 0) return '#b5aaa5';
    if (p >= 75) return '#7a9e7e';
    if (p >= 40) return '#e88f68';
    return '#c96a3f';
  }

  goalColor(g: any): string {
    return this.goalColors[`${g.metric}_${g.direction}`] ?? '#c96a3f';
  }

  goalIcon(g: any): string {
    return this.goalIcons[g.metric] ?? '🎯';
  }

  goalMetricLabel(metric: string): string {
    const map: Record<string, string> = {
      weight: 'Weight', bmi: 'BMI', bodyFat: 'Body Fat',
      muscleMass: 'Muscle Mass', systolic: 'Blood Pressure', glucose: 'Glucose',
    };
    return map[metric] ?? metric;
  }

  goalProgress(g: any): number {
    const current = this.getLatestMetricValue(g.metric);
    const start   = g.startValue;
    const target  = g.targetValue;
    if (g.direction === 'decrease') {
      if (current <= target) return 100;
      if (current >= start || start === target) return 0;
      return Math.round(((start - current) / (start - target)) * 100);
    } else {
      if (current >= target) return 100;
      if (current <= start || start === target) return 0;
      return Math.round(((current - start) / (target - start)) * 100);
    }
  }

  goalDaysLeft(g: any): number {
    return Math.max(0, Math.ceil((new Date(g.deadline).getTime() - Date.now()) / 86400000));
  }

  goalRemaining(g: any): string {
    if (this.goalProgress(g) >= 100) return 'Goal reached!';
    const current = this.getLatestMetricValue(g.metric);
    const diff = Math.abs(Math.round((g.targetValue - current) * 10) / 10);
    return `${diff} ${g.unit} to go`;
  }

  initials(p: any): string {
    return `${p.firstName?.[0] ?? ''}${p.lastName?.[0] ?? ''}`.toUpperCase();
  }

  avatarBg(): string {
    return ['#fde8d8','#e8f0dd','#fff3e0','#e8e4f8','#d8eef8','#fde8ee'][(this.profile?.id ?? 0) % 6];
  }

  avatarColor(): string {
    return ['#c96a3f','#5a8060','#c8883a','#7a4eb0','#3a80b0','#b04060'][(this.profile?.id ?? 0) % 6];
  }

  age(dob: string): string {
    if (!dob) return '—';
    return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000)) + ' y/o';
  }

  bloodTypeColor(bt: string): string {
    if (!bt) return '#b5aaa5';
    if (bt.includes('O'))  return '#c96a3f';
    if (bt.includes('AB')) return '#7a9e7e';
    if (bt.includes('A'))  return '#4ab8f0';
    return '#a47cf0';
  }

  bmiColor(bmi: number): string {
    if (bmi < 18.5) return '#4ab8f0';
    if (bmi < 25)   return '#7a9e7e';
    if (bmi < 30)   return '#e88f68';
    return '#c96a3f';
  }

  bmiLabel(bmi: number): string {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25)   return 'Normal';
    if (bmi < 30)   return 'Overweight';
    return 'Obese';
  }

  // ── Pagination ────────────────────────────────────────────────────────
  pageSize   = 5;
  currentPage = 1;

  get totalPages(): number { return Math.ceil(this.biometrics.length / this.pageSize); }

  get pagedBiometrics(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.biometrics.slice(start, start + this.pageSize);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalPages) this.currentPage = p;
  }

  // ── Latest / Previous ────────────────────────────────────────────────
  get latest(): any | null {
    return this.biometrics.length ? this.biometrics[this.biometrics.length - 1] : null;
  }

  get previous(): any | null {
    return this.biometrics.length >= 2 ? this.biometrics[this.biometrics.length - 2] : null;
  }

  delta(curr: number | null, prev: number | null): string {
    if (curr == null || prev == null) return '';
    const d = Math.round((curr - prev) * 10) / 10;
    return (d > 0 ? '+' : '') + d;
  }

  deltaClass(curr: number | null, prev: number | null, lowerIsBetter = true): string {
    if (curr == null || prev == null) return '';
    const better = lowerIsBetter ? curr < prev : curr > prev;
    return better ? 'delta--good' : curr === prev ? '' : 'delta--bad';
  }
}