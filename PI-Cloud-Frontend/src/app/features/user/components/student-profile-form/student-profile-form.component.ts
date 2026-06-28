import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-student-profile-form',
  templateUrl: './student-profile-form.component.html',
  styleUrl: './student-profile-form.component.scss'
})
export class StudentProfileFormComponent {

  @Input() form!: FormGroup;

  photoFile: File | null = null;
  photoPreview: string | null = null;
  photoError = '';

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.handleFile(input.files[0]);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) this.handleFile(file);
  }

  handleFile(file: File): void {
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
    this.form.patchValue({ studentImgFile: file });

    const reader = new FileReader();
    reader.onload = (e) => this.photoPreview = e.target?.result as string;
    reader.readAsDataURL(file);
  }

  removeFile(event: MouseEvent): void {
    event.stopPropagation();
    this.photoFile = null;
    this.photoPreview = null;
    this.photoError = '';
    this.form.patchValue({ studentImgFile: null });
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}