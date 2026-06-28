import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { EventRegistrationService } from '../../../../../services/event-registration.service';
import { AdminEventRegistration } from '../../../../../models/admin-event-registration.model';

@Component({
  selector: 'app-event-registrations',
  templateUrl: './event-registrations.component.html',
  styleUrls: ['./event-registrations.component.scss']
})
export class EventRegistrationsComponent implements OnChanges {

  @Input() eventId!: number | null;
  @Input() eventTitle = '';
  @Output() close = new EventEmitter<void>();

  registrations: AdminEventRegistration[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';

  statuses: Array<'CONFIRMED' | 'WAITING' | 'CANCELLED' | 'ATTENDED'> = [
    'CONFIRMED',
    'WAITING',
    'CANCELLED',
    'ATTENDED'
  ];

  constructor(private registrationService: EventRegistrationService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['eventId'] && this.eventId) {
      this.loadRegistrations();
    }
  }

  loadRegistrations(): void {
    if (!this.eventId) return;

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.registrationService.getAdminRegistrationsByEventId(this.eventId).subscribe({
      next: (data) => {
        this.registrations = data || [];
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Erreur lors du chargement des participants.';
        this.loading = false;
      }
    });
  }

  updateStatus(id: number, status: string): void {
    this.successMessage = '';
    this.errorMessage = '';

    this.registrationService.updateRegistrationStatus(id, status).subscribe({
      next: () => {
        this.successMessage = 'Statut modifié avec succès.';
        this.loadRegistrations();
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Erreur lors de la modification du statut.';
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }

  getInitials(firstName?: string, lastName?: string, fullName?: string): string {
    if (firstName || lastName) {
      return `${(firstName?.[0] || '')}${(lastName?.[0] || '')}`.toUpperCase() || 'ST';
    }

    if (fullName) {
      const parts = fullName.trim().split(' ').filter(Boolean);
      if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return 'ST';
  }

  getStatusClass(status: string): string {
    return status.toLowerCase();
  }
}