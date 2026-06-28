import { SportEvent } from './sport-event.model';

export interface EventReview {
  id?: number;
  rating: number;
  comment: string;
  reviewDate?: string;
  studentId?: number;
  event?: SportEvent;
}