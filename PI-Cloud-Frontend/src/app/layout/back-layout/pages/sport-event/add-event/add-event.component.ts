import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { SportEvent, EventCategory } from '../../../../../models/sport-event.model';
import { SportEventService } from '../../../../../services/sport-event.service';
import { AiPredictionService, EventPredictionResponse } from '../../../../../services/ai-prediction.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-add-event',
  templateUrl: './add-event.component.html',
  styleUrls: ['./add-event.component.scss']
})
export class AddEventComponent implements OnChanges {

  @Input() selectedEvent: SportEvent | null = null;
  @Input() isEditMode = false;

  @Output() addEvent = new EventEmitter<SportEvent>();
  @Output() updateEvent = new EventEmitter<SportEvent>();
  @Output() cancelEdit = new EventEmitter<void>();

  categories: EventCategory[] = ['SPORT', 'CINEMA', 'KARAOKE', 'CEREMONY', 'OTHER'];

  eventForm: SportEvent = this.getEmptyForm();
  selectedFile: File | null = null;
  imagePreview: string | null = null;

  predictionResult: EventPredictionResponse | null = null;
  predictionError = '';
  predicting = false;
generatingDescription = false;
  serverErrorMessage = '';
  fieldErrors: { [key: string]: string } = {};

  showMapModal = false;

  constructor(
    private sportEventService: SportEventService,
    private aiPredictionService: AiPredictionService,
    private router: Router
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedEvent']) {
      if (this.selectedEvent) {
        this.eventForm = { ...this.selectedEvent };
        this.imagePreview = this.selectedEvent.imageUrl || null;
      } else {
        this.eventForm = this.getEmptyForm();
        this.imagePreview = null;
      }

      this.predictionResult = null;
      this.predictionError = '';
    }
  }

  getEmptyForm(): SportEvent {
    return {
      title: '',
      description: '',
      eventDate: '',
      location: '',
      latitude: undefined,
      longitude: undefined,
      category: 'SPORT',
    eventDetail: '-----',
      maxParticipants: 1,
      currentParticipants: 0,
      imageUrl: '',
      status: 'OPEN'
    };
  }
generateDescription(): void {
  const title = this.eventForm.title;
  const category = this.eventForm.category;
  const date = this.eventForm.eventDate;

  this.sportEventService.generateDescription(title, category, date)
    .subscribe(res => {
      this.eventForm.description = res;
    });
}
onTitleBlur(): void {
  const title = this.eventForm.title?.trim();
  const description = this.eventForm.description?.trim();

  // Génère seulement si titre existe et description vide
  if (title && !description) {
    this.generateDescription();
  }
}
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  predictDemand(): void {
  if (!this.eventForm.category || !this.eventForm.location || !this.eventForm.eventDate || !this.eventForm.maxParticipants) {
    this.predictionError = 'Veuillez remplir la catégorie, le lieu, la date et le nombre max.';
    this.predictionResult = null;
    return;
  }

  const payload = {
    category: this.eventForm.category,
    location: this.eventForm.location.trim(),
    eventDate: new Date(this.eventForm.eventDate).toISOString(),
    maxParticipants: Number(this.eventForm.maxParticipants)
  };

  console.log('Payload envoyé à Flask:', payload);

  this.predicting = true;
  this.predictionError = '';
  this.predictionResult = null;

  this.aiPredictionService.predictEvent(payload).subscribe({
    next: (res) => {
      this.predictionResult = res;
      this.predicting = false;
    },
    error: (err) => {
      console.error('Erreur prédiction IA :', err);
      this.predictionError = err?.error?.error || 'Erreur lors de la prédiction IA.';
      this.predictionResult = null;
      this.predicting = false;
    }
  });
}

  getPredictionBadgeClass(): string {
    if (!this.predictionResult?.prediction) return '';

    switch (this.predictionResult.prediction) {
      case 'HIGH':
        return 'high';
      case 'MEDIUM':
        return 'medium';
      case 'LOW':
        return 'low';
      default:
        return '';
    }
  }

  getAIMessage(): string {
  if (!this.predictionResult) return '';

  switch (this.predictionResult.prediction) {
    case 'HIGH':
      return '🔥 Strong demand expected. This event has a high chance of success.';
    case 'MEDIUM':
      return '⚖️ Moderate demand. Consider optimizing time or location.';
    case 'LOW':
      return '⚠️ Low demand predicted. Try changing the schedule or category.';
    default:
      return '';
  }
}

  private handleBackendError(err: any): void {
    this.serverErrorMessage = '';
    this.fieldErrors = {};

    if (typeof err?.error === 'string') {
      this.serverErrorMessage = err.error;
      return;
    }

    if (err?.error?.message) {
      this.serverErrorMessage = err.error.message;
    }

    if (err?.error?.errors && Array.isArray(err.error.errors)) {
      err.error.errors.forEach((e: any) => {
        if (e.field) {
          this.fieldErrors[e.field] = e.defaultMessage || 'Valeur invalide';
        }
      });
    }
  }

  onSubmit(form?: any): void {
    if (form && form.invalid) {
      return;
    }
this.eventForm.eventDetail = '-----';
    if (this.isEditMode) {
      this.updateEvent.emit(this.eventForm);
      return;
    }

    if (this.selectedFile) {
      const formData = new FormData();
      formData.append('file', this.selectedFile);

      this.sportEventService.uploadImage(formData).subscribe({
        next: (imageUrl: string) => {
          this.eventForm.imageUrl = imageUrl;
          this.saveEvent();
        },
        error: (err) => {
          console.error('Erreur upload image :', err);
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: 'Erreur lors de l’upload de l’image.'
          });
        }
      });
    } else {
      this.saveEvent();
    }
  }

  saveEvent(): void {
    this.serverErrorMessage = '';
    this.fieldErrors = {};
   this.eventForm.eventDetail = '-----';
    this.sportEventService.createEvent(this.eventForm).subscribe({
      next: () => {
        this.addEvent.emit(this.eventForm);

        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: 'L’événement a été ajouté avec succès.',
          timer: 1600,
          showConfirmButton: false
        }).then(() => {
          this.eventForm = this.getEmptyForm();
          this.selectedFile = null;
          this.imagePreview = null;
          this.predictionResult = null;
          this.predictionError = '';
          this.router.navigate(['/admin/events']);
        });
      },
      error: (err) => {
        console.error('Erreur lors de l’ajout de l’événement :', err);
        this.handleBackendError(err);

        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: this.serverErrorMessage || 'Erreur lors de l’ajout de l’événement.'
        });
      }
    });
  }

  onCancel(): void {
    this.eventForm = this.getEmptyForm();
    this.selectedFile = null;
    this.imagePreview = null;
    this.predictionResult = null;
    this.predictionError = '';
    this.cancelEdit.emit();
  }

  openMapModal(): void {
    this.showMapModal = true;
  }

  closeMapModal(): void {
    this.showMapModal = false;
  }

  handleLocationSelected(data: { address: string; latitude: number; longitude: number }): void {
    this.eventForm.location = data.address;
    this.eventForm.latitude = data.latitude;
    this.eventForm.longitude = data.longitude;
    this.showMapModal = false;
  }
}