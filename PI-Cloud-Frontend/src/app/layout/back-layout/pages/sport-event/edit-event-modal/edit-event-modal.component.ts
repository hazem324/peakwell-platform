import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { SportEvent, EventCategory } from '../../../../../models/sport-event.model';
import { SportEventService } from '../../../../../services/sport-event.service';

@Component({
  selector: 'app-edit-event-modal',
  templateUrl: './edit-event-modal.component.html',
  styleUrls: ['./edit-event-modal.component.scss']
})
export class EditEventModalComponent implements OnChanges {

  @Input() event!: SportEvent;
  @Output() save = new EventEmitter<SportEvent>();
  @Output() close = new EventEmitter<void>();

  categories: EventCategory[] = ['SPORT', 'CINEMA', 'KARAOKE', 'CEREMONY', 'OTHER'];

  formData!: SportEvent;
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  loading = false;

  showMapModal = false;

  constructor(private sportEventService: SportEventService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['event'] && this.event) {
      this.formData = { ...this.event };
      this.imagePreview = this.event.imageUrl || null;
      this.selectedFile = null;
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

  openMapModal(): void {
    this.showMapModal = true;
  }

  closeMapModal(): void {
    this.showMapModal = false;
  }

  handleLocationSelected(data: { address: string; latitude: number; longitude: number }): void {
    this.formData.location = data.address;
    this.formData.latitude = data.latitude;
    this.formData.longitude = data.longitude;
    this.showMapModal = false;
  }

  onSubmit(): void {
    this.formData.eventDetail = '-----';
    if (!this.formData) return;

    if (this.selectedFile) {
      this.loading = true;

      const formDataUpload = new FormData();
      formDataUpload.append('file', this.selectedFile);

      this.sportEventService.uploadImage(formDataUpload).subscribe({
        next: (imageUrl: string) => {
          this.formData.imageUrl = imageUrl;
          this.loading = false;
          this.save.emit(this.formData);
        },
        error: (err) => {
          this.loading = false;
          console.error('Erreur upload image :', err);
          alert('Erreur lors de l’upload de l’image.');
        }
      });
    } else {
      this.save.emit(this.formData);
    }
  }

  onClose(): void {
    this.close.emit();
  }
}