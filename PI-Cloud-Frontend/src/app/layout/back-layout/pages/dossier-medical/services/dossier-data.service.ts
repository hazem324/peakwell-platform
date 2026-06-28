import { Injectable } from '@angular/core';
import { BiometricEntry, ConsultationNote, HealthAlert, DossierClient } from '../models/dossier.models';

@Injectable({ providedIn: 'root' })
export class DossierDataService {

  readonly clients: DossierClient[] = [
    {
      id: 1, name: 'Maya Johnson', initials: 'MJ', avatarColor: '#fde8d8',
      dob: 'March 12, 1992', age: 34, gender: 'Female', goal: 'Weight Loss',
      assignedNutritionist: 'Dr. Sarah Mills', memberSince: 'September 2024',
      bloodType: 'A+', allergies: ['Gluten', 'Lactose'],
      conditions: ['Hypothyroidism']
    },
    {
      id: 2, name: 'Carlos Mena', initials: 'CM', avatarColor: '#e8f0dd',
      dob: 'July 5, 1995', age: 30, gender: 'Male', goal: 'Muscle Gain',
      assignedNutritionist: 'Dr. Sarah Mills', memberSince: 'December 2024',
      bloodType: 'O+', allergies: [], conditions: []
    },
    {
      id: 3, name: 'James Fowler', initials: 'JF', avatarColor: '#fff3e0',
      dob: 'January 20, 1988', age: 38, gender: 'Male', goal: 'Weight Loss',
      assignedNutritionist: 'Dr. Sarah Mills', memberSince: 'January 2025',
      bloodType: 'B+', allergies: ['Nuts'],
      conditions: ['Type 2 Diabetes', 'Hypertension']
    },
  ];

  readonly biometricHistory: Record<number, BiometricEntry[]> = {
    1: [
      { id: 1, date: 'Sep 2024', weight: 82, height: 165, bmi: 30.1, bodyFat: 34, muscleMass: 42, systolic: 128, diastolic: 82, glucose: 95,  notes: 'Initial measurement' },
      { id: 2, date: 'Oct 2024', weight: 80, height: 165, bmi: 29.4, bodyFat: 33, muscleMass: 43, systolic: 125, diastolic: 80, glucose: 92,  notes: 'Good progress' },
      { id: 3, date: 'Nov 2024', weight: 78, height: 165, bmi: 28.7, bodyFat: 31, muscleMass: 44, systolic: 122, diastolic: 78, glucose: 90,  notes: 'On track' },
      { id: 4, date: 'Dec 2024', weight: 77, height: 165, bmi: 28.3, bodyFat: 30, muscleMass: 44, systolic: 120, diastolic: 76, glucose: 89,  notes: 'Holiday period, slight slowdown' },
      { id: 5, date: 'Jan 2025', weight: 76, height: 165, bmi: 27.9, bodyFat: 29, muscleMass: 45, systolic: 118, diastolic: 75, glucose: 87,  notes: 'Excellent momentum' },
      { id: 6, date: 'Feb 2025', weight: 74, height: 165, bmi: 27.2, bodyFat: 28, muscleMass: 46, systolic: 116, diastolic: 74, glucose: 86,  notes: 'Best month yet' },
      { id: 7, date: 'Mar 2025', weight: 73, height: 165, bmi: 26.8, bodyFat: 27, muscleMass: 47, systolic: 115, diastolic: 73, glucose: 85,  notes: 'Near goal weight' },
    ],
    2: [
      { id: 1, date: 'Dec 2024', weight: 75, height: 178, bmi: 23.7, bodyFat: 16, muscleMass: 58, systolic: 118, diastolic: 74, glucose: 88,  notes: 'Starting bulk phase' },
      { id: 2, date: 'Jan 2025', weight: 77, height: 178, bmi: 24.3, bodyFat: 16, muscleMass: 60, systolic: 116, diastolic: 72, glucose: 86,  notes: 'Good muscle gain' },
      { id: 3, date: 'Feb 2025', weight: 79, height: 178, bmi: 24.9, bodyFat: 15, muscleMass: 63, systolic: 115, diastolic: 71, glucose: 85,  notes: 'Excellent progress' },
      { id: 4, date: 'Mar 2025', weight: 81, height: 178, bmi: 25.6, bodyFat: 15, muscleMass: 65, systolic: 114, diastolic: 70, glucose: 84,  notes: 'On target' },
    ],
    3: [
      { id: 1, date: 'Jan 2025', weight: 98, height: 175, bmi: 32.0, bodyFat: 38, muscleMass: 48, systolic: 148, diastolic: 95, glucose: 142, notes: 'Initial — high risk profile' },
      { id: 2, date: 'Feb 2025', weight: 96, height: 175, bmi: 31.3, bodyFat: 37, muscleMass: 48, systolic: 144, diastolic: 92, glucose: 135, notes: 'Slight improvement' },
      { id: 3, date: 'Mar 2025', weight: 97, height: 175, bmi: 31.7, bodyFat: 37, muscleMass: 48, systolic: 146, diastolic: 93, glucose: 138, notes: 'Weight regained — adherence low' },
    ],
  };

  readonly consultationNotes: Record<number, ConsultationNote[]> = {
    1: [
      {
        id: 1, date: 'Sep 5, 2024', nutritionist: 'Dr. Sarah Mills', type: 'Initial Consultation',
        summary: 'Patient presents with hypothyroidism. Goal is to lose 10kg over 6 months. Low-glycemic, gluten-free plan recommended.',
        recommendations: ['1,600 kcal/day target', 'Increase fiber to 30g/day', 'Avoid processed carbohydrates', 'Walk 30 min daily'],
        nextAppointment: 'Oct 3, 2024'
      },
      {
        id: 2, date: 'Nov 10, 2024', nutritionist: 'Dr. Sarah Mills', type: 'Follow-up',
        summary: 'Lost 4kg in 2 months. Energy levels improved. Sleep quality better. Continuing same plan with slight calorie reduction.',
        recommendations: ['Reduce to 1,500 kcal/day', 'Add resistance training 2x/week', 'Increase protein to 110g/day'],
        nextAppointment: 'Jan 8, 2025'
      },
      {
        id: 3, date: 'Feb 12, 2025', nutritionist: 'Dr. Sarah Mills', type: 'Progress Review',
        summary: 'Exceptional adherence — 88%. Lost 8kg total. BMI now below 28. Transitioning to maintenance phase planning.',
        recommendations: ['Increase calories to 1,700 for maintenance', 'Introduce new food variety', 'Continue monitoring thyroid markers'],
        nextAppointment: 'Apr 3, 2025'
      },
    ],
    3: [
      {
        id: 1, date: 'Jan 8, 2025', nutritionist: 'Dr. Sarah Mills', type: 'Initial Consultation',
        summary: 'High-risk profile: T2 diabetes, hypertension, obesity class I. Requires strict dietary intervention and close monitoring.',
        recommendations: ['1,500 kcal/day — low carb', 'Limit sodium to 1,500mg/day', 'Eliminate sugary drinks completely', 'Daily glucose monitoring'],
        nextAppointment: 'Feb 5, 2025'
      },
      {
        id: 2, date: 'Feb 18, 2025', nutritionist: 'Dr. Sarah Mills', type: 'Urgent Review',
        summary: 'Adherence dropped to 54%. Glucose still elevated. Weight regain of 1kg. Patient reports stress and poor sleep.',
        recommendations: ['Simplify meal plan', 'Add stress management techniques', 'Refer to endocrinologist', 'Increase check-in frequency'],
        nextAppointment: 'Mar 6, 2025'
      },
    ],
  };

  getClient(id: number): DossierClient | undefined {
    return this.clients.find(c => c.id === id);
  }

  getBiometrics(clientId: number): BiometricEntry[] {
    return this.biometricHistory[clientId] ?? [];
  }

  getLatestBiometric(clientId: number): BiometricEntry | null {
    const entries = this.getBiometrics(clientId);
    return entries.length ? entries[entries.length - 1] : null;
  }

  getAlerts(clientId: number): HealthAlert[] {
    const entries = this.getBiometrics(clientId);
    const alerts: HealthAlert[] = [];
    if (entries.length < 2) return alerts;

    const latest = entries[entries.length - 1];
    const prev   = entries[entries.length - 2];

    // Weight change alert
    const weightDiff = latest.weight - prev.weight;
    if (weightDiff > 2) {
      alerts.push({ type: 'danger', metric: 'Weight', message: `Rapid weight gain of ${weightDiff}kg in one month`, value: `${latest.weight}kg`, date: latest.date });
    } else if (weightDiff < -3) {
      alerts.push({ type: 'warning', metric: 'Weight', message: `Rapid weight loss of ${Math.abs(weightDiff)}kg in one month`, value: `${latest.weight}kg`, date: latest.date });
    }

    // Blood pressure alert
    if (latest.systolic && latest.systolic > 140) {
      alerts.push({ type: 'danger', metric: 'Blood Pressure', message: 'Systolic BP above 140 mmHg — hypertension range', value: `${latest.systolic}/${latest.diastolic} mmHg`, date: latest.date });
    } else if (latest.systolic && latest.systolic > 130) {
      alerts.push({ type: 'warning', metric: 'Blood Pressure', message: 'Elevated blood pressure — monitor closely', value: `${latest.systolic}/${latest.diastolic} mmHg`, date: latest.date });
    }

    // Glucose alert
    if (latest.glucose && latest.glucose > 126) {
      alerts.push({ type: 'danger', metric: 'Glucose', message: 'Fasting glucose above 126 mg/dL — diabetic range', value: `${latest.glucose} mg/dL`, date: latest.date });
    } else if (latest.glucose && latest.glucose > 100) {
      alerts.push({ type: 'warning', metric: 'Glucose', message: 'Pre-diabetic glucose level detected', value: `${latest.glucose} mg/dL`, date: latest.date });
    }

    if (alerts.length === 0) {
      alerts.push({ type: 'info', metric: 'General', message: 'All biometric values within healthy ranges', value: '✓ Normal', date: latest.date });
    }

    return alerts;
  }

  getNotes(clientId: number): ConsultationNote[] {
    return this.consultationNotes[clientId] ?? [];
  }

  calculateBMI(weight: number, height: number): number {
    return Math.round((weight / Math.pow(height / 100, 2)) * 10) / 10;
  }

  getBMICategory(bmi: number): { label: string; color: string } {
    if (bmi < 18.5) return { label: 'Underweight', color: '#4ab8f0' };
    if (bmi < 25)   return { label: 'Normal',      color: '#7a9e7e' };
    if (bmi < 30)   return { label: 'Overweight',  color: '#e88f68' };
    return               { label: 'Obese',         color: '#c96a3f' };
  }
}