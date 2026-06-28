import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { EventReviewService } from '../../../../../services/event-review.service';
import { AdminEventReview } from '../../../../../models/admin-event-review.model';

@Component({
  selector: 'app-list-avis',
  templateUrl: './list-avis.component.html',
  styleUrls: ['./list-avis.component.scss']
})
export class ListAvisComponent implements OnChanges {

  @Input() eventId!: number | null;
  @Input() eventTitle = '';
  @Output() close = new EventEmitter<void>();

  reviews: AdminEventReview[] = [];
  loading = false;
  errorMessage = '';

  constructor(private reviewService: EventReviewService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['eventId'] && this.eventId) {
      this.loadReviews();
    }
  }

  loadReviews(): void {
    if (!this.eventId) return;

    this.loading = true;
    this.errorMessage = '';

    this.reviewService.getAdminReviewsByEventId(this.eventId).subscribe({
      next: (data) => {
        this.reviews = data || [];
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Erreur lors du chargement des avis.';
        this.loading = false;
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }

  getAverageRating(): number {
    if (this.reviews.length === 0) return 0;
    const total = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    return total / this.reviews.length;
  }

  getInitials(name?: string): string {
    if (!name) return 'ST';

    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }

    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  getStarsArray(rating: number): number[] {
    return Array.from({ length: rating }, (_, i) => i + 1);
  }
}