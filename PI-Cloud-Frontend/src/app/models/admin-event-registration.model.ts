export interface AdminEventRegistration {
  id?: number;
  registrationDate?: string;
  status: 'CONFIRMED' | 'WAITING' | 'CANCELLED' | 'ATTENDED';

  studentId?: number;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  imageUrl?: string | null;
}