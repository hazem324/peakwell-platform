export interface BiometricEntry {
  id: number;
  date: string;
  weight: number;         // kg
  height: number;         // cm
  bmi: number;
  bodyFat: number | null; // %
  muscleMass: number | null; // kg
  systolic: number | null;   // mmHg
  diastolic: number | null;  // mmHg
  glucose: number | null;    // mg/dL
  notes: string;
}

export interface ConsultationNote {
  id: number;
  date: string;
  nutritionist: string;
  type: string;
  summary: string;
  recommendations: string[];
  nextAppointment: string;
}

export interface HealthAlert {
  type: 'danger' | 'warning' | 'info';
  metric: string;
  message: string;
  value: string;
  date: string;
}

export interface DossierClient {
  id: number;
  name: string;
  initials: string;
  avatarColor: string;
  dob: string;
  age: number;
  gender: string;
  goal: string;
  assignedNutritionist: string;
  memberSince: string;
  bloodType: string;
  allergies: string[];
  conditions: string[];
}
