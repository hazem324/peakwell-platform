import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DossierService } from '../../services/dossier.service';
import { ToastServiceService } from '../../../../../services/toast-service.service';

@Component({
  selector: 'app-diet-recommender',
  templateUrl: './diet-recommender.component.html',
  styleUrls: ['./diet-recommender.component.scss']
})
export class DietRecommenderComponent implements OnInit {
  private apiBase = 'http://localhost:8090/peakwell/api/diet-predict';

  modelLoaded = false;
  loading = false;
  predicted = false;
  result: any = null;

  // Auto-filled from profile/biometrics
  age = 30; gender = 1; height = 175; weight = 78; bmi = 25.5;
  systolic = 120; diastolic = 80; glucose = 95;
  bodyFat = 22; muscleMass = 35; exerciseHrs = 3; activityLevel = 1;

  // Conditions
  hasHypertension = false; hasDiabetes = false; hasPrediabetes = false;
  hasObesity = false; hasHeartDisease = false; hasKidneyIssue = false; hasCholesterol = false;

  // Symptoms (0-5)
  symFatigue = 0; symBloating = 0; symJointPain = 0; symHeadache = 0;
  symBrainFog = 0; symMuscleWeakness = 0; symInsomnia = 0; symAnxiety = 0;

  // Goals
  goalLoseWeight = false; goalBuildMuscle = false; goalLowerBp = false; goalControlGlucose = false;

  symptomFields = [
    { key: 'symFatigue', label: 'Fatigue' },
    { key: 'symBloating', label: 'Bloating' },
    { key: 'symJointPain', label: 'Joint Pain' },
    { key: 'symHeadache', label: 'Headache' },
    { key: 'symBrainFog', label: 'Brain Fog' },
    { key: 'symMuscleWeakness', label: 'Muscle Weakness' },
    { key: 'symInsomnia', label: 'Insomnia' },
    { key: 'symAnxiety', label: 'Anxiety' },
  ];

  constructor(private http: HttpClient, private dossierService: DossierService, private toastService: ToastServiceService) {}

  ngOnInit(): void {
    this.http.get<any>(`${this.apiBase}/status`).subscribe({
      next: r => this.modelLoaded = r.modelLoaded, error: () => this.modelLoaded = false
    });
    // Auto-fill from latest biometrics
    this.dossierService.entries$.subscribe(entries => {
      if (entries.length > 0) {
        const latest = entries[entries.length - 1];
        this.weight = latest.weight ?? this.weight;
        this.height = latest.height ?? this.height;
        this.bmi = latest.bmi ?? this.bmi;
        this.systolic = latest.systolic ?? this.systolic;
        this.diastolic = latest.diastolic ?? this.diastolic;
        this.glucose = latest.glucose ?? this.glucose;
        this.bodyFat = latest.bodyFat ?? this.bodyFat;
        this.muscleMass = latest.muscleMass ?? this.muscleMass;
        this.hasObesity = this.bmi > 30;
      }
    });
    this.dossierService.profile$.subscribe(profile => {
      if (profile) {
        this.height = profile.height ?? this.height;
        if (profile.conditions) {
          this.hasHypertension = profile.conditions.some((c: string) => c.toLowerCase().includes('hypertension'));
          this.hasDiabetes = profile.conditions.some((c: string) => c.toLowerCase().includes('diabetes'));
          this.hasHeartDisease = profile.conditions.some((c: string) => c.toLowerCase().includes('heart'));
          this.hasKidneyIssue = profile.conditions.some((c: string) => c.toLowerCase().includes('kidney'));
          this.hasCholesterol = profile.conditions.some((c: string) => c.toLowerCase().includes('cholesterol'));
        }
      }
    });
  }

  predict(): void {
    this.loading = true;
    this.activityLevel = this.exerciseHrs < 1.5 ? 0 : this.exerciseHrs < 4 ? 1 : this.exerciseHrs < 8 ? 2 : 3;

    this.http.post<any>(this.apiBase, {
      age: this.age, gender: this.gender, height: this.height, weight: this.weight, bmi: this.bmi,
      systolic: this.systolic, diastolic: this.diastolic, glucose: this.glucose,
      body_fat: this.bodyFat, muscle_mass: this.muscleMass,
      exercise_hrs: this.exerciseHrs, activity_level: this.activityLevel,
      has_hypertension: this.hasHypertension ? 1 : 0, has_diabetes: this.hasDiabetes ? 1 : 0,
      has_prediabetes: this.hasPrediabetes ? 1 : 0, has_obesity: this.hasObesity ? 1 : 0,
      has_heart_disease: this.hasHeartDisease ? 1 : 0, has_kidney_issue: this.hasKidneyIssue ? 1 : 0,
      has_cholesterol: this.hasCholesterol ? 1 : 0,
      sym_fatigue: this.symFatigue, sym_bloating: this.symBloating,
      sym_joint_pain: this.symJointPain, sym_headache: this.symHeadache,
      sym_brain_fog: this.symBrainFog, sym_muscle_weakness: this.symMuscleWeakness,
      sym_insomnia: this.symInsomnia, sym_anxiety: this.symAnxiety,
      goal_lose_weight: this.goalLoseWeight ? 1 : 0, goal_build_muscle: this.goalBuildMuscle ? 1 : 0,
      goal_lower_bp: this.goalLowerBp ? 1 : 0, goal_control_glucose: this.goalControlGlucose ? 1 : 0,
    }).subscribe({
      next: r => { this.result = r; this.predicted = true; this.loading = false; },
      error: () => { this.loading = false; this.toastService.show('❌ Prediction failed'); }
    });
  }

  reset(): void { this.predicted = false; this.result = null; }

  dietIcon(diet: string): string {
    const m: Record<string, string> = {
      'Mediterranean': '🫒', 'Low-Carb': '🥩', 'DASH': '🫀', 'Diabetic-Friendly': '🩸',
      'High-Protein': '💪', 'Low-Sodium': '🧂'
    };
    return m[diet] ?? '🥗';
  }

  dietColor(diet: string): string {
    const m: Record<string, string> = {
      'Mediterranean': '#7a9e7e', 'Low-Carb': '#c96a3f', 'DASH': '#a47cf0', 'Diabetic-Friendly': '#4ab8f0',
      'High-Protein': '#e88f68', 'Low-Sodium': '#8a7e78'
    };
    return m[diet] ?? '#8a7e78';
  }

  getSymVal(key: string): number { return (this as any)[key] ?? 0; }
  setSymVal(key: string, val: number): void { (this as any)[key] = val; }
}