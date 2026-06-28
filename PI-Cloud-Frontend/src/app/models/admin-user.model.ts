import { StudentProfile } from './student-profile.model';
import { DietitianProfile } from './dietitian-profile.model';

export interface Address {
  street:     string;
  city:       string;
  state:      string;
  postalCode: string;
  country:    string;
}

export interface AdminUser {
  id:               number;
  email:            string;
  firstName:        string;
  lastName:         string;
  role:             'STUDENT' | 'DIETITIAN' | 'RESTAURANT' | null;
  profileCompleted: boolean;
  enabled:          boolean;
  phoneNumber:      string | null;
  imageUrl:         string | null;
  address:          Address | null;

  studentProfile:   StudentProfile   | null;
  dietitianProfile: DietitianProfile | null;

  createdAt?: string;
  // local-only (not from backend)
  status?:          'ACTIVE' | 'BANNED' | 'PENDING';
  banReason?:       string;
  banDescription?:  string;
}