
import { Component, OnInit } from '@angular/core';
import { SportEvent } from '../../../../models/sport-event.model';
import { EventRegistration } from '../../../../models/event-registration.model';
import { SportEventService } from '../../../../services/sport-event.service';
import { EventRegistrationService } from '../../../../services/event-registration.service';
import { RecommendationService } from '../../../../services/recommendation.service';
import { UserService } from '../../../../services/user.service';
import { User } from '../../../../models/user.model';

type GridCard = SportEvent | null;

@Component({
  selector: 'app-sport-event',
  templateUrl: './sport-event.component.html',
  styleUrls: ['./sport-event.component.scss']
})
export class SportEventComponent implements OnInit {

  events: SportEvent[] = [];
  filteredEvents: SportEvent[] = [];
  paginatedEvents: SportEvent[] = [];

  loading = false;
  errorMessage = '';
  successMessage = '';
  recommendedEvents: SportEvent[] = [];

  currentUser: User | null = null;

  searchTerm = '';
  selectedStatus = '';
  selectedDate = '';

  currentPage = 1;
  itemsPerPage = 6;
  totalPages = 1;

  selectedEvent: SportEvent | null = null;
  showDetailsModal = false;

  showRecommended = false;
  showLocationMapModal = false;

  joinedEventIds: Set<number> = new Set();
  waitingEventIds: Set<number> = new Set();

  constructor(
    private sportEventService: SportEventService,
    private registrationService: EventRegistrationService,
    private recommendationService: RecommendationService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.userService.getMe().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.loadMyRegistrations();
        this.loadEvents();
        this.loadRecommendations();
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Impossible de récupérer l’utilisateur connecté.';
      }
    });
  }

  toggleRecommended(): void {
    this.showRecommended = !this.showRecommended;
    this.currentPage = 1;
    this.updatePagination();
  }

  get displayCards(): GridCard[] {
    const cards: GridCard[] = [...this.paginatedEvents];

    while (cards.length < this.itemsPerPage) {
      cards.push(null);
    }

    return cards;
  }

  loadMyRegistrations(): void {
    if (!this.currentUser?.id) return;

    this.registrationService.getRegistrationsByStudentId(this.currentUser.id).subscribe({
      next: (registrations: EventRegistration[]) => {
        this.joinedEventIds.clear();
        this.waitingEventIds.clear();

        registrations.forEach(reg => {
          const eventId = reg.event?.id;
          if (!eventId) return;

          if (reg.status === 'WAITING') {
            this.waitingEventIds.add(eventId);
          } else if (reg.status !== 'CANCELLED') {
            this.joinedEventIds.add(eventId);
          }
        });
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  isAlreadyJoined(event: SportEvent): boolean {
    return !!event.id && this.joinedEventIds.has(event.id);
  }

  isInWaitingList(event: SportEvent): boolean {
    return !!event.id && this.waitingEventIds.has(event.id);
  }

  loadEvents(): void {
    this.loading = true;
    this.errorMessage = '';

    this.sportEventService.getAllEvents().subscribe({
      next: (data) => {
        this.events = data || [];
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Erreur lors du chargement des événements.';
        this.loading = false;
      }
    });
  }

  loadRecommendations(): void {
    if (!this.currentUser?.id) return;

    this.recommendationService.getRecommendations(this.currentUser.id).subscribe({
      next: (data) => {
        this.recommendedEvents = data || [];
        this.updatePagination();
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  applyFilters(): void {
    this.filteredEvents = this.events.filter(event => {
      const title = event.title?.toLowerCase() || '';
      const location = event.location?.toLowerCase() || '';
      const search = this.searchTerm.toLowerCase().trim();

      const matchesSearch =
        !search ||
        title.includes(search) ||
        location.includes(search);

      let matchesStatus = false;

      if (!this.selectedStatus) {
        matchesStatus = event.status !== 'FINISHED' && event.status !== 'CANCELLED';
      } else {
        matchesStatus = event.status === this.selectedStatus;
      }

      const matchesDate =
        !this.selectedDate ||
        new Date(event.eventDate).toISOString().slice(0, 10) === this.selectedDate;

      return matchesSearch && matchesStatus && matchesDate;
    });

    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    const source = this.showRecommended ? this.recommendedEvents : this.filteredEvents;

    this.totalPages = Math.ceil(source.length / this.itemsPerPage);

    if (this.totalPages === 0) {
      this.totalPages = 1;
    }

    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;

    this.paginatedEvents = source.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagination();
  }

  openEventDetails(event: SportEvent): void {
    this.selectedEvent = event;
    this.showDetailsModal = true;
  }

  closeEventDetails(): void {
    this.selectedEvent = null;
    this.showDetailsModal = false;
  }

  joinEvent(event: SportEvent, e?: MouseEvent): void {
    if (e) e.stopPropagation();
    if (!event.id) return;

    this.successMessage = '';
    this.errorMessage = '';

    if (this.isAlreadyJoined(event) || this.isInWaitingList(event)) {
      return;
    }

    if (event.status === 'FINISHED' || event.status === 'CANCELLED') {
      this.errorMessage = 'Cet événement n’est pas disponible pour inscription.';
      return;
    }

    this.registrationService.createRegistration(event.id).subscribe({
      next: (res) => {
        if (res.status === 'WAITING') {
          this.successMessage = 'L’événement est complet. Vous avez été ajouté à la salle d’attente.';
        } else {
          this.successMessage = 'Inscription confirmée avec succès.';
        }

        this.loadMyRegistrations();
        this.loadEvents();
        this.loadRecommendations();
        this.closeEventDetails();
      },
      error: (err) => {
        console.error(err);

        if (typeof err?.error === 'string') {
          this.errorMessage = err.error;
        } else if (err?.error?.message) {
          this.errorMessage = err.error.message;
        } else if (err?.error?.error) {
          this.errorMessage = err.error.error;
        } else {
          this.errorMessage = 'Erreur lors de l’inscription.';
        }
      }
    });
  }

  openLocationMap(event: SportEvent, e?: MouseEvent): void {
    if (e) e.stopPropagation();

    if (!event.latitude || !event.longitude) {
      this.errorMessage = 'La localisation de cet événement n’est pas disponible.';
      return;
    }

    this.selectedEvent = event;
    this.showLocationMapModal = true;
  }

  closeLocationMapModal(): void {
    this.showLocationMapModal = false;
  }

  openInGoogleMaps(event: SportEvent, e?: MouseEvent): void {
    if (e) e.stopPropagation();

    if (!event.latitude || !event.longitude) {
      this.errorMessage = 'Localisation non disponible';
      return;
    }

    const url = `https://www.google.com/maps?q=${event.latitude},${event.longitude}`;
    window.open(url, '_blank');
  }
}