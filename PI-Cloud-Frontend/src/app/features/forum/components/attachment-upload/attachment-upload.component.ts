import { Component, Input, Output, EventEmitter } from '@angular/core';
import { AttachmentService } from '../../../../services/attachment.service';

@Component({
  selector: 'app-attachment-upload',
  templateUrl: './attachment-upload.component.html',
  styleUrl: './attachment-upload.component.css'
})
export class AttachmentUploadComponent {
  @Input() articleId: number | null = null;
  @Output() attachmentUploaded = new EventEmitter<void>();

  uploading: boolean = false;
  uploadProgress: number = 0;
  error: string = '';
  dragOver: boolean = false;

  // Accepted file types
  acceptedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ];

  constructor(private attachmentService: AttachmentService) { }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.uploadFile(files[0]);
    }
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.uploadFile(file);
    }
  }

  private uploadFile(file: File): void {
    if (!this.articleId) return;

    // Validate file type
    if (!this.acceptedTypes.includes(file.type)) {
      this.error = 'File type not accepted. Please upload PDF, Office documents, text, or image files.';
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      this.error = 'File size exceeds 10MB limit. Please upload a smaller file.';
      return;
    }

    this.uploading = true;
    this.uploadProgress = 0;
    this.error = '';

    this.attachmentService.uploadAttachment(this.articleId, file).subscribe({
      next: () => {
        this.uploading = false;
        this.uploadProgress = 0;
        this.attachmentUploaded.emit();
        // Reset file input
        const fileInput = document.getElementById('file-input') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      },
      error: (err) => {
        console.error('Upload error:', err);
        this.error = 'Failed to upload file. Please try again.';
        this.uploading = false;
      }
    });
  }
}
