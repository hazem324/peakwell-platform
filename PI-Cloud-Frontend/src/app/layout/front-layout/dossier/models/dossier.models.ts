export interface MedicalProfile {
  firstName: string;
  lastName: string;
  dob: string;
  gender: 'male' | 'female' | 'other' | '';
  bloodType: string;
  height: number;
  allergies: string[];
  conditions: string[];
  medications: string[];
  emergencyContact: string;
  isComplete: boolean;
}

export interface BiometricEntry {
  id: number;
  date: string;
  weight: number;
  height: number;
  bmi: number;
  bodyFat: number | null;
  muscleMass: number | null;
  systolic: number | null;
  diastolic: number | null;
  glucose: number | null;
  notes: string;
}

export interface HealthAlert {
  type: 'danger' | 'warning' | 'info';
  metric: string;
  message: string;
  value: string;
}

export interface MetricCard {
  label: string;
  value: string;
  icon: string;
  color: string;
  change: number | null;
  unit: string;
  status?: string;
  statusColor?: string;
  good: boolean;
}