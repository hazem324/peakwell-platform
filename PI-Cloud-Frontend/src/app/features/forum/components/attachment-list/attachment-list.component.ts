import { Component, Input, OnInit } from '@angular/core';
import { AttachmentService } from '../../../../services/attachment.service';
import { Attachment } from '../../../../models/attachment.model';

@Component({
  selector: 'app-attachment-list',
  templateUrl: './attachment-list.component.html',
  styleUrl: './attachment-list.component.css'
})
export class AttachmentListComponent implements OnInit {
  @Input() articleId: number | null = null;
  @Input() readOnly: boolean = false;

  attachments: Attachment[] = [];
  loading: boolean = false;
  error: string = '';

  constructor(private attachmentService: AttachmentService) { }

  ngOnInit(): void {
    if (this.articleId) {
      this.loadAttachments();
    }
  }

  loadAttachments(): void {
    if (!this.articleId) return;

    this.loading = true;
    this.attachmentService.getAttachmentsByArticle(this.articleId).subscribe({
      next: (attachments) => {
        this.attachments = attachments;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading attachments:', err);
        this.error = 'Failed to load attachments';
        this.loading = false;
      }
    });
  }

  downloadAttachment(attachment: Attachment): void {
    this.attachmentService.downloadAttachment(attachment.id || 0, attachment.fileName);
  }

  deleteAttachment(id: number | undefined): void {
    if (!id) return;

    if (confirm('Are you sure you want to delete this attachment?')) {
      this.attachmentService.deleteAttachment(id).subscribe({
        next: () => {
          this.attachments = this.attachments.filter(a => a.id !== id);
        },
        error: (err) => {
          console.error('Error deleting attachment:', err);
          this.error = 'Failed to delete attachment';
        }
      });
    }
  }

  getFileIcon(fileType: string): string {
    if (!fileType) return '📄';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return '📊';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('video')) return '🎬';
    if (fileType.includes('audio')) return '🎵';
    if (fileType.includes('zip') || fileType.includes('archive')) return '📦';
    return '📁';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return d.toLocaleDateString('en-US', options);
  }
}
