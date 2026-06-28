import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-dietitian-profile-form',
  templateUrl: './dietitian-profile-form.component.html',
  styleUrl: './dietitian-profile-form.component.scss'
})
export class DietitianProfileFormComponent {

  @Input() form!: FormGroup;

  certificationFile: File | null = null;
  photoFile: File | null = null;
  photoPreview: string | null = null;
  certError = '';
  photoError = '';

  onFileChange(event: Event, type: 'cert' | 'photo'): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.handleFile(input.files[0], type);
  }

  onDrop(event: DragEvent, type: 'cert' | 'photo'): void {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) this.handleFile(file, type);
  }

  handleFile(file: File, type: 'cert' | 'photo'): void {
    if (type === 'cert') {
      this.certError = '';
      const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!allowed.includes(file.type)) {
        this.certError = 'Only PDF, JPG or PNG files are allowed.';
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.certError = 'File must be smaller than 5MB.';
        return;
      }
      this.certificationFile = file;
      this.form.patchValue({ certificationFile: file });
    }

    if (type === 'photo') {
      this.photoError = '';
      const allowed = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowed.includes(file.type)) {
        this.photoError = 'Only JPG, PNG or WEBP files are allowed.';
        return;
      }
      if (file.size > 3 * 1024 * 1024) {
        this.photoError = 'Photo must be smaller than 3MB.';
        return;
      }
      this.photoFile = file;
      this.form.patchValue({ imgFile: file });

      const reader = new FileReader();
      reader.onload = (e) => this.photoPreview = e.target?.result as string;
      reader.readAsDataURL(file);
    }
  }

  removeFile(type: 'cert' | 'photo', event: MouseEvent): void {
    event.stopPropagation();
    if (type === 'cert') {
      this.certificationFile = null;
      this.certError = '';
      this.form.patchValue({ certificationFile: null });
    }
    if (type === 'photo') {
      this.photoFile = null;
      this.photoPreview = null;
      this.photoError = '';
      this.form.patchValue({ imgFile: null });
    }
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}