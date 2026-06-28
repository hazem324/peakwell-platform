import { Component, OnInit } from '@angular/core';
import { SportEvent } from '../../../../models/sport-event.model';
import { SportEventService } from '../../../../services/sport-event.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-sport-event',
  templateUrl: './sport-event.component.html',
  styleUrls: ['./sport-event.component.scss']
})
export class SportEventComponent implements OnInit {

  events: SportEvent[] = [];
  filteredEvents: SportEvent[] = [];
  paginatedEvents: SportEvent[] = [];

  selectedEvent: SportEvent | null = null;
  showEditModal = false;
  loading = false;
  errorMessage = '';
  successMessage = '';

  searchTerm = '';
  selectedStatus = '';
  selectedDate = '';

  currentPage = 1;
  itemsPerPage = 6;
  totalPages = 1;

  selectedReviewsEventId: number | null = null;
  selectedReviewsEventTitle = '';
  showReviewsModal = false;

  selectedParticipantsEventId: number | null = null;
  selectedParticipantsEventTitle = '';
  showParticipantsModal = false;

  constructor(private sportEventService: SportEventService) {}

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.loading = true;
    this.errorMessage = '';

    this.sportEventService.getAllEvents().subscribe({
      next: (data) => {
        this.events = data || [];
        this.applyFilters(false);
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Erreur lors du chargement des événements.';
        this.loading = false;
      }
    });
  }

  applyFilters(resetPage: boolean = true): void {
    this.filteredEvents = this.events.filter(event => {
      const title = event.title?.toLowerCase() || '';
      const location = event.location?.toLowerCase() || '';
      const search = this.searchTerm.toLowerCase().trim();

      const matchesSearch =
        !search ||
        title.includes(search) ||
        location.includes(search);

      const matchesStatus =
        !this.selectedStatus || event.status === this.selectedStatus;

      const matchesDate =
        !this.selectedDate ||
        new Date(event.eventDate).toISOString().slice(0, 10) === this.selectedDate;

      return matchesSearch && matchesStatus && matchesDate;
    });

    if (resetPage) {
      this.currentPage = 1;
    }

    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredEvents.length / this.itemsPerPage);

    if (this.totalPages === 0) {
      this.totalPages = 1;
    }

    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;

    this.paginatedEvents = this.filteredEvents.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagination();
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  onEditRequested(event: SportEvent): void {
    this.selectedEvent = { ...event };
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.selectedEvent = null;
    this.showEditModal = false;
  }

  onReviewsRequested(event: SportEvent): void {
    if (!event.id) return;

    this.selectedReviewsEventId = event.id;
    this.selectedReviewsEventTitle = event.title;
    this.showReviewsModal = true;
  }

  closeReviewsModal(): void {
    this.showReviewsModal = false;
    this.selectedReviewsEventId = null;
    this.selectedReviewsEventTitle = '';
  }

  onParticipantsRequested(event: SportEvent): void {
    if (!event.id) return;

    this.selectedParticipantsEventId = event.id;
    this.selectedParticipantsEventTitle = event.title;
    this.showParticipantsModal = true;
  }

  closeParticipantsModal(): void {
    this.showParticipantsModal = false;
    this.selectedParticipantsEventId = null;
    this.selectedParticipantsEventTitle = '';
  }

  handleUpdateEvent(event: SportEvent): void {
    if (!event.id) return;

    this.sportEventService.updateEvent(event.id, event).subscribe({
      next: () => {
        this.errorMessage = '';
        this.closeEditModal();

        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: 'L’événement a été modifié avec succès.',
          timer: 1600,
          showConfirmButton: false
        }).then(() => {
          this.loadEvents();
        });
      },
      error: (err) => {
        console.error(err);

        let message = 'Erreur lors de la modification.';
        if (typeof err?.error === 'string') {
          message = err.error;
        } else if (err?.error?.message) {
          message = err.error.message;
        }

        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: message
        });
      }
    });
  }

  onDeleteRequested(eventId: number): void {
    Swal.fire({
      title: 'Supprimer cet événement ?',
      text: 'Cette action est irréversible.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d97745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.sportEventService.deleteEvent(eventId).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Supprimé',
              text: 'L’événement a été supprimé avec succès.',
              timer: 1400,
              showConfirmButton: false
            });

            this.events = this.events.filter(event => event.id !== eventId);
            this.applyFilters(false);
            this.loadEvents();
          },
          error: (err) => {
            console.error(err);
            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text: 'Erreur lors de la suppression de l’événement.'
            });
          }
        });
      }
    });
  }
}