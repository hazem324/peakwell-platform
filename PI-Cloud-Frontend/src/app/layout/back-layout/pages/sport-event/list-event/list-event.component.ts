import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { SportEvent } from '../../../../../models/sport-event.model';

type GridCard = SportEvent | null;

@Component({
  selector: 'app-list-event',
  templateUrl: './list-event.component.html',
  styleUrls: ['./list-event.component.scss']
})
export class ListEventComponent implements OnChanges {

  @Input() events: SportEvent[] = [];
  @Input() loading = false;

  @Output() editRequested = new EventEmitter<SportEvent>();
  @Output() deleteRequested = new EventEmitter<number>();
  @Output() reviewsRequested = new EventEmitter<SportEvent>();
  @Output() participantsRequested = new EventEmitter<SportEvent>();

  searchTerm = '';
  selectedStatus = '';
  selectedDate = '';

  filteredEvents: SportEvent[] = [];
  paginatedEvents: SportEvent[] = [];

  currentPage = 1;
  itemsPerPage = 6;
  totalPages = 1;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['events']) {
      this.applyFilters();
    }
  }

  onEdit(event: SportEvent): void {
    this.editRequested.emit(event);
  }

  onDelete(id?: number): void {
    if (!id) return;
    this.deleteRequested.emit(id);
  }

  onReviews(event: SportEvent): void {
    this.reviewsRequested.emit(event);
  }

  onParticipants(event: SportEvent): void {
    this.participantsRequested.emit(event);
  }

  applyFilters(): void {
    const search = this.searchTerm.toLowerCase().trim();

    this.filteredEvents = (this.events || []).filter(event => {
      const title = event.title?.toLowerCase() || '';
      const location = event.location?.toLowerCase() || '';
      const category = event.category?.toLowerCase() || '';
      const detail = event.eventDetail?.toLowerCase() || '';

      const matchesSearch =
        !search ||
        title.includes(search) ||
        location.includes(search) ||
        category.includes(search) ||
        detail.includes(search);

      const matchesStatus =
        !this.selectedStatus || event.status === this.selectedStatus;

      const matchesDate =
        !this.selectedDate ||
        new Date(event.eventDate).toISOString().slice(0, 10) === this.selectedDate;

      return matchesSearch && matchesStatus && matchesDate;
    });

    this.currentPage = 1;
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

  get displayCards(): GridCard[] {
    const cards: GridCard[] = [...this.paginatedEvents];

    while (cards.length < this.itemsPerPage) {
      cards.push(null);
    }

    return cards;
  }
}