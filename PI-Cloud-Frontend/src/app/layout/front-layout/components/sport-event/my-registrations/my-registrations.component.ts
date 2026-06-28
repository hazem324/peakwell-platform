import { Component, OnInit } from '@angular/core';
import { EventRegistration } from '../../../../../models/event-registration.model';
import { EventReview } from '../../../../../models/event-review.model';
import { EventRegistrationService } from '../../../../../services/event-registration.service';
import { EventReviewService } from '../../../../../services/event-review.service';
import { UserService } from '../../../../../services/user.service';
import { User } from '../../../../../models/user.model';
import Swal from 'sweetalert2';

type RegistrationWithReview = EventRegistration & {
  myReview?: EventReview | null;
};

@Component({
  selector: 'app-my-registrations',
  templateUrl: './my-registrations.component.html',
  styleUrls: ['./my-registrations.component.scss']
})
export class MyRegistrationsComponent implements OnInit {

  registrations: RegistrationWithReview[] = [];
  currentUser: User | null = null;
  loading = false;
  hoverRating = 0;

  showReviewModal = false;
  selectedRegistration: RegistrationWithReview | null = null;
  selectedReviewId: number | null = null;
  isEditMode = false;

  reviewForm = {
    rating: null as number | null,
    comment: ''
  };

  constructor(
    private registrationService: EventRegistrationService,
    private reviewService: EventReviewService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.userService.getMe().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.loadMyRegistrations();
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  loadMyRegistrations(): void {
    if (!this.currentUser?.id) return;

    this.loading = true;

    this.registrationService.getRegistrationsByStudentId(this.currentUser.id).subscribe({
      next: (registrations) => {
        this.reviewService.getReviewsByStudentId(this.currentUser!.id).subscribe({
          next: (reviews) => {
            this.registrations = registrations.map(reg => {
              const review = reviews.find(r => r.event?.id === reg.event?.id) || null;
              return {
                ...reg,
                myReview: review
              };
            });
            this.loading = false;
          },
          error: (err) => {
            console.error(err);
            this.registrations = registrations.map(reg => ({
              ...reg,
              myReview: null
            }));
            this.loading = false;
          }
        });
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  setRating(star: number): void {
    this.reviewForm.rating = star;
  }

  canLeaveReview(reg: RegistrationWithReview): boolean {
    return !reg.myReview &&
           reg.status === 'ATTENDED' &&
           reg.event?.status === 'FINISHED';
  }

  canCancelRegistration(reg: RegistrationWithReview): boolean {
    return !!reg.id &&
           (reg.status === 'CONFIRMED' || reg.status === 'WAITING') &&
           reg.event?.status !== 'FINISHED' &&
           reg.event?.status !== 'CANCELLED';
  }

  cancelRegistration(reg: RegistrationWithReview): void {
    if (!reg.id) return;

    Swal.fire({
      title: 'Annuler cette inscription ?',
      text: 'Vous serez retiré de cet événement.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d97745',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Oui, annuler',
      cancelButtonText: 'Retour'
    }).then((result: any) => {
      if (result.isConfirmed) {
        if (!reg.id) return;
          this.registrationService.deleteRegistration(reg.id!).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Inscription annulée',
              text: 'Votre inscription a été supprimée avec succès.',
              timer: 1500,
              showConfirmButton: false
            }).then(() => {
              this.loadMyRegistrations();
            });
          },
          error: (err) => {
            console.error(err);

            let message = 'Erreur lors de l’annulation de l’inscription.';
            if (typeof err?.error === 'string') {
              message = err.error;
            } else if (err?.error?.message) {
              message = err.error.message;
            } else if (err?.error?.error) {
              message = err.error.error;
            }

            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text: message
            });
          }
        });
      }
    });
  }

  openCreateReviewModal(reg: RegistrationWithReview): void {
    this.selectedRegistration = reg;
    this.selectedReviewId = null;
    this.isEditMode = true;

    this.reviewForm = {
      rating: 0,
      comment: ''
    };

    this.showReviewModal = true;
  }

  openViewReviewModal(reg: RegistrationWithReview): void {
    if (!reg.myReview) return;

    this.selectedRegistration = reg;
    this.selectedReviewId = reg.myReview.id || null;
    this.isEditMode = false;

    this.reviewForm = {
      rating: reg.myReview.rating,
      comment: reg.myReview.comment
    };

    this.showReviewModal = true;
  }

  enableEditMode(): void {
    this.isEditMode = true;
  }

  closeReviewModal(): void {
    this.showReviewModal = false;
    this.selectedRegistration = null;
    this.selectedReviewId = null;
    this.isEditMode = false;
    this.reviewForm = {
      rating: null,
      comment: ''
    };
  }

  submitReview(form: any): void {
    if (form.invalid || !this.selectedRegistration?.event?.id || !this.reviewForm.rating) {
      return;
    }

    const payload: EventReview = {
      rating: this.reviewForm.rating,
      comment: this.reviewForm.comment,
      event: this.selectedRegistration.event
    };

    if (this.selectedReviewId) {
      this.reviewService.updateReview(this.selectedReviewId, payload).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Succès',
            text: 'Review updated successfully.',
            timer: 1500,
            showConfirmButton: false
          }).then(() => {
            this.closeReviewModal();
            this.loadMyRegistrations();
          });
        },
        error: (err) => {
          console.error(err);
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: err?.error?.error || err?.error || 'Error while updating review.'
          });
        }
      });
    } else {
      this.reviewService.createReview(this.selectedRegistration.event.id, payload).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Succès',
            text: 'Review submitted successfully.',
            timer: 1500,
            showConfirmButton: false
          }).then(() => {
            this.closeReviewModal();
            this.loadMyRegistrations();
          });
        },
        error: (err) => {
          console.error(err);
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: err?.error?.error || err?.error || 'Error while submitting review.'
          });
        }
      });
    }
  }

  deleteReview(): void {
    if (!this.selectedReviewId) return;

    Swal.fire({
      title: 'Supprimer cet avis ?',
      text: 'Cette action est irréversible.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d97745',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Retour'
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.reviewService.deleteReview(this.selectedReviewId!).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Supprimé',
              text: 'Review deleted successfully.',
              timer: 1400,
              showConfirmButton: false
            }).then(() => {
              this.closeReviewModal();
              this.loadMyRegistrations();
            });
          },
          error: (err) => {
            console.error(err);
            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text: err?.error?.message || err?.error?.error || 'Error while deleting review.'
            });
          }
        });
      }
    });
  }
}
