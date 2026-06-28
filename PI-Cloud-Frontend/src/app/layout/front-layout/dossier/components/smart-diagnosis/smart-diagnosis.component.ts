import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastServiceService } from '../../../../../services/toast-service.service';
import { DossierService } from '../../services/dossier.service';

interface DiseasePrediction {
  disease: string;
  probability: number;
  description: string;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  recommendation: string;
  specialty: string;
  matchedSymptoms: string[];
  matchCount: number;
}

interface DiseaseResult {
  predictions: DiseasePrediction[];
  totalScreened: number;
  symptomsAnalyzed: string[];
  modelInfo: string;
  macroF1: number;
}

interface SymptomPrediction {
  symptom: string;
  predictedSeverity: number;
  severityLabel: string;
  confidence: number;
  probabilities: Record<string, number>;
}

interface PredictionResult {
  overallSeverity: number;
  overallSeverityLabel: string;
  averageSeverity: number;
  averageConfidence: number;
  symptomCount: number;
  worstSymptom: string;
  worstSeverity: number;
  worstSeverityLabel: string;
  predictions: SymptomPrediction[];
  modelType: string;
  riskFactors: string[];
  multiSymptomWarning: string | null;
}

@Component({
  selector: 'app-smart-diagnosis',
  templateUrl: './smart-diagnosis.component.html',
  styleUrls: ['./smart-diagnosis.component.scss']
})
export class SmartDiagnosisComponent implements OnInit {
  private apiBase = 'http://localhost:8090/peakwell/api/predict';

  modelLoaded = false;
  activeTab: 'severity' | 'disease' = 'severity';

  // Severity tab
  loading = false;
  predicted = false;
  result: PredictionResult | null = null;

  // Disease tab
  loadingDiseases = false;
  predictedDiseases = false;
  diseaseResult: DiseaseResult | null = null;

  biometricsLoaded = false;

  // Multi-symptom selection
  selectedSymptoms: string[] = [];
  stressLevel = 3;
  mood = 3;
  energyLevel = 3;
  sleepHours = 7;
  waterIntakeMl = 2000;
  timeOfDay = 'morning';
  triggers: string[] = [];
  age = 30;
  bmi = 24;
  hasChronicCondition = false;
  exerciseHoursWeekly = 3;
  caffeineCupsDaily = 2;

  // Biometric fields (auto-populated from user's latest entry)
  systolicBp: number | null = null;
  diastolicBp: number | null = null;
  bodyFatPercent: number | null = null;
  muscleMassKg: number | null = null;
  glucoseMgDl: number | null = null;

  symptoms = [
    'Headache', 'Fatigue', 'Nausea', 'Dizziness', 'Insomnia',
    'Bloating', 'Joint Pain', 'Muscle Pain', 'Anxiety', 'Brain Fog',
    'Chest Tightness', 'Shortness of Breath', 'Back Pain', 'Stomach Pain',
    'Heartburn', 'Cramps', 'Numbness', 'Skin Rash'
  ];

  timesOfDay = [
    { value: 'morning', label: '🌅 Morning' },
    { value: 'afternoon', label: '☀️ Afternoon' },
    { value: 'evening', label: '🌇 Evening' },
    { value: 'night', label: '🌙 Night' },
  ];

  commonTriggers = [
    'Caffeine', 'Poor sleep', 'Stress', 'Skipped meal', 'Exercise',
    'Dehydration', 'Screen time', 'Alcohol', 'Weather', 'Medication'
  ];

  constructor(
    private http: HttpClient,
    private toastService: ToastServiceService,
    private dossierService: DossierService,
  ) {}

  ageFromProfile = false;
  bmiFromProfile = false;

  get showForm(): boolean {
    return (this.activeTab === 'severity' && !this.predicted) ||
           (this.activeTab === 'disease' && !this.predictedDiseases);
  }

  ngOnInit(): void {
    this.http.get<any>(`${this.apiBase}/status`).subscribe({
      next: res => this.modelLoaded = res.modelLoaded,
      error: () => this.modelLoaded = false
    });
    this.loadUserBiometrics();
    this.loadUserProfile();
  }

  private loadUserProfile(): void {
    const existing = this.dossierService.profile;
    if (existing?.dateOfBirth) {
      this.applyAge(existing.dateOfBirth);
      return;
    }
    this.dossierService.loadProfile();
    this.dossierService.profile$.subscribe(profile => {
      if (!profile?.dateOfBirth || this.ageFromProfile) return;
      this.applyAge(profile.dateOfBirth);
    });
  }

  private applyAge(dateOfBirth: string): void {
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) age--;
    this.age = age;
    this.ageFromProfile = true;
  }

  private loadUserBiometrics(): void {
    const existingEntries = this.dossierService.entries;
    if (existingEntries.length) {
      this.applyBiometrics(existingEntries);
    } else {
      this.dossierService.loadBiometrics();
    }
    this.dossierService.entries$.subscribe(entries => {
      if (!entries.length || this.bmiFromProfile) return;
      this.applyBiometrics(entries);
    });
  }

  private applyBiometrics(entries: any[]): void {
    const latest = entries[entries.length - 1];
    this.bmi = latest.bmi ?? this.bmi;
    this.bmiFromProfile = !!latest.bmi;
    this.systolicBp = latest.systolic;
    this.diastolicBp = latest.diastolic;
    this.bodyFatPercent = latest.bodyFat;
    this.muscleMassKg = latest.muscleMass;
    this.glucoseMgDl = latest.glucose;
    this.biometricsLoaded = true;
  }

  toggleSymptom(symptom: string): void {
    const idx = this.selectedSymptoms.indexOf(symptom);
    if (idx >= 0) this.selectedSymptoms.splice(idx, 1);
    else this.selectedSymptoms.push(symptom);
  }

  toggleTrigger(trigger: string): void {
    const idx = this.triggers.indexOf(trigger);
    if (idx >= 0) this.triggers.splice(idx, 1);
    else this.triggers.push(trigger);
  }

  predict(): void {
    if (this.selectedSymptoms.length === 0) {
      this.toastService.show('⚠️ Select at least one symptom');
      return;
    }

    this.loading = true;
    this.http.post<PredictionResult>(`${this.apiBase}/severity`, {
      stressLevel: this.stressLevel,
      mood: this.mood,
      energyLevel: this.energyLevel,
      sleepHours: this.sleepHours,
      waterIntakeMl: this.waterIntakeMl,
      timeOfDay: this.timeOfDay,
      symptoms: this.selectedSymptoms,
      triggers: this.triggers,
      age: this.age,
      bmi: this.bmi,
      hasChronicCondition: this.hasChronicCondition,
      exerciseHoursWeekly: this.exerciseHoursWeekly,
      caffeineCupsDaily: this.caffeineCupsDaily,
      systolicBp: this.systolicBp,
      diastolicBp: this.diastolicBp,
      bodyFatPercent: this.bodyFatPercent,
      muscleMassKg: this.muscleMassKg,
      glucoseMgDl: this.glucoseMgDl,
    }).subscribe({
      next: res => { this.result = res; this.predicted = true; this.loading = false; },
      error: () => { this.toastService.show('❌ Prediction failed'); this.loading = false; }
    });
  }

  reset(): void { this.predicted = false; this.result = null; }

  predictDiseases(): void {
    if (this.selectedSymptoms.length === 0) {
      this.toastService.show('⚠️ Select at least one symptom');
      return;
    }
    this.loadingDiseases = true;
    this.http.post<DiseaseResult>(`${this.apiBase}/diseases`, {
      stressLevel: this.stressLevel,
      mood: this.mood,
      energyLevel: this.energyLevel,
      sleepHours: this.sleepHours,
      waterIntakeMl: this.waterIntakeMl,
      timeOfDay: this.timeOfDay,
      symptoms: this.selectedSymptoms,
      triggers: this.triggers,
      age: this.age,
      bmi: this.bmi,
      hasChronicCondition: this.hasChronicCondition,
      exerciseHoursWeekly: this.exerciseHoursWeekly,
      caffeineCupsDaily: this.caffeineCupsDaily,
      systolicBp: this.systolicBp,
      diastolicBp: this.diastolicBp,
      bodyFatPercent: this.bodyFatPercent,
      muscleMassKg: this.muscleMassKg,
      glucoseMgDl: this.glucoseMgDl,
    }).subscribe({
      next: res => { this.diseaseResult = res; this.predictedDiseases = true; this.loadingDiseases = false; },
      error: () => { this.toastService.show('❌ Disease prediction failed'); this.loadingDiseases = false; }
    });
  }

  resetDiseases(): void { this.predictedDiseases = false; this.diseaseResult = null; }

  urgencyColor(urgency: string): string {
    const map: Record<string, string> = {
      low: '#7a9e7e', medium: '#e88f68', high: '#c96a3f', urgent: '#a8200d'
    };
    return map[urgency] ?? '#8a7e78';
  }

  urgencyLabel(urgency: string): string {
    const map: Record<string, string> = {
      low: 'Monitor', medium: 'Consult Soon', high: 'See Doctor', urgent: 'Urgent Care'
    };
    return map[urgency] ?? urgency;
  }

  severityColor(sev: number): string {
    const map: Record<number, string> = { 1: '#7a9e7e', 2: '#a8c5ac', 3: '#e88f68', 4: '#c96a3f', 5: '#a8532c' };
    return map[sev] ?? '#8a7e78';
  }

  moodEmoji(val: number): string {
    const map: Record<number, string> = { 1: '😞', 2: '😕', 3: '😐', 4: '🙂', 5: '😊' };
    return map[val] ?? '😐';
  }

  scaleLabel(val: number): string {
    const map: Record<number, string> = { 1: 'Very Low', 2: 'Low', 3: 'Medium', 4: 'High', 5: 'Very High' };
    return map[val] ?? '';
  }

  confidenceLabel(conf: number): string {
    if (conf >= 75) return 'High';
    if (conf >= 45) return 'Medium';
    return 'Low';
  }

  confidenceClass(conf: number): string {
    if (conf >= 75) return 'sr-conf-chip--high';
    if (conf >= 45) return 'sr-conf-chip--medium';
    return 'sr-conf-chip--low';
  }
}