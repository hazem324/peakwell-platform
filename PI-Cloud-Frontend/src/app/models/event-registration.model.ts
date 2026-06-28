import { SportEvent } from './sport-event.model';

export interface EventRegistration {
  id?: number;
  registrationDate?: string;
  status: 'CONFIRMED' | 'WAITING' | 'CANCELLED' | 'ATTENDED';
  studentId?: number;
  event?: SportEvent;
}