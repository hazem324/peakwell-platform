export interface AdminEventReview {
  id?: number;
  rating: number;
  comment: string;
  reviewDate?: string;
  studentId?: number;
  studentName?: string;
  studentImageUrl?: string | null;
}