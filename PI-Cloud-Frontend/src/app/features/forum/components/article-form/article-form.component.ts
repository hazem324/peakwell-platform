import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ArticleService } from '../../../../services/article.service';
import { AttachmentService } from '../../../../services/attachment.service';
import { AuthService } from '../../../../services/auth.service';
import { UserForumService } from '../../../../services/user-forum.service';
import { Article } from '../../../../models/article.model';
import { Attachment } from '../../../../models/attachment.model';

@Component({
  selector: 'app-article-form',
  templateUrl: './article-form.component.html',
  styleUrl: './article-form.component.css'
})
export class ArticleFormComponent implements OnInit {
  form!: FormGroup;
  isEditMode: boolean = false;
  articleId: number | null = null;
  loading: boolean = false;
  submitting: boolean = false;
  error: string = '';
  selectedImageFile: File | null = null;
  imagePreview: string | null = null;

  // Draft auto-save functionality
  private readonly DRAFT_KEY = 'article_draft';
  draftRestored: boolean = false;

  // Attachment handling
  existingAttachments: Attachment[] = [];
  selectedAttachmentFiles: File[] = [];
  selectedAttachmentPreviews: { file: File; name: string; size: string }[] = [];
  uploadingAttachments: boolean = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private articleService: ArticleService,
    private attachmentService: AttachmentService,
    private authService: AuthService,
    private userForumService: UserForumService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    // Check authentication before allowing access
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    // Check if user has permission to create/edit articles
    if (!this.userForumService.canCreateArticle()) {
      this.router.navigate(['/forum']);
      return;
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.articleId = Number(id);
      this.isEditMode = true;
      this.loadArticle(this.articleId);
    } else {
      // TASK 3: Load draft from localStorage on create mode only
      this.loadDraft();
    }

    // TASK 2: Auto-save form changes to localStorage
    this.form.valueChanges.subscribe(value => {
      if (!this.isEditMode) {
        localStorage.setItem(this.DRAFT_KEY, JSON.stringify(value));
      }
    });

    // TASK 5: Warn before leaving page if form has changes
    window.addEventListener('beforeunload', (event) => {
      if (this.form.dirty && !this.submitting) {
        event.preventDefault();
        event.returnValue = '';
      }
    });
  }

  initForm(): void {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      content: ['', [Validators.required, Validators.minLength(10)]],
      embedUrl: ['']
    });
  }

  private loadDraft(): void {
    const draft = localStorage.getItem(this.DRAFT_KEY);
    if (draft) {
      try {
        const draftData = JSON.parse(draft);
        this.form.patchValue(draftData);
        this.draftRestored = true;
        // Clear the restored flag after a delay so UI message shows briefly
        setTimeout(() => {
          this.draftRestored = false;
        }, 3000);
      } catch (err) {
        console.error('Error parsing draft:', err);
      }
    }
  }

  loadArticle(id: number): void {
    this.loading = true;
    this.articleService.getById(id).subscribe({
      next: (article: Article) => {
        this.form.patchValue({
          title: article.title,
          content: article.content,
          embedUrl: article.embedUrl || ''
        });
        if (article.imageUrl) {
          this.imagePreview = this.articleService.getImageUrl(article.imageUrl);
        }
        // Load existing attachments in edit mode
        this.loadExistingAttachments(id);
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading article:', err);
        this.error = 'Failed to load article';
        this.loading = false;
      }
    });
  }

  loadExistingAttachments(articleId: number): void {
    this.attachmentService.getAttachmentsByArticle(articleId).subscribe({
      next: (attachments) => {
        this.existingAttachments = attachments;
      },
      error: (err: any) => {
        console.error('Error loading attachments:', err);
      }
    });
  }

  onImageSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedImageFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.selectedImageFile = null;
    this.imagePreview = null;
    const fileInput = document.getElementById('image-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  onAttachmentSelected(event: any): void {
    const files: FileList = event.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        this.selectedAttachmentFiles.push(file);
        this.selectedAttachmentPreviews.push({
          file: file,
          name: file.name,
          size: this.formatFileSize(file.size)
        });
      }
      // Reset file input
      const fileInput = document.getElementById('attachment-input') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  }

  removeSelectedAttachment(index: number): void {
    this.selectedAttachmentFiles.splice(index, 1);
    this.selectedAttachmentPreviews.splice(index, 1);
  }

  deleteExistingAttachment(attachmentId: number | undefined): void {
    if (!attachmentId) return;

    if (confirm('Are you sure you want to delete this attachment?')) {
      this.attachmentService.deleteAttachment(attachmentId).subscribe({
        next: () => {
          this.existingAttachments = this.existingAttachments.filter(a => a.id !== attachmentId);
        },
        error: (err: any) => {
          console.error('Error deleting attachment:', err);
          this.error = 'Failed to delete attachment';
        }
      });
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  getFileIcon(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (['pdf'].includes(ext)) return '📄';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return '📊';
    if (['doc', 'docx'].includes(ext)) return '📝';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '🖼️';
    if (['mp4', 'avi', 'mov'].includes(ext)) return '🎬';
    if (['mp3', 'wav', 'flac'].includes(ext)) return '🎵';
    if (['zip', 'rar', '7z'].includes(ext)) return '📦';
    return '📁';
  }

  uploadAttachments(articleId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.selectedAttachmentFiles.length === 0) {
        resolve();
        return;
      }

      this.uploadingAttachments = true;
      let uploadedCount = 0;

      this.selectedAttachmentFiles.forEach(file => {
        this.attachmentService.uploadAttachment(articleId, file).subscribe({
          next: () => {
            uploadedCount++;
            if (uploadedCount === this.selectedAttachmentFiles.length) {
              this.uploadingAttachments = false;
              this.selectedAttachmentFiles = [];
              this.selectedAttachmentPreviews = [];
              resolve();
            }
          },
          error: (err: any) => {
            console.error('Error uploading attachment:', err);
            this.uploadingAttachments = false;
            reject(err);
          }
        });
      });
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      return;
    }

    this.submitting = true;
    this.error = '';

    const article: Article = this.form.value;

    if (this.isEditMode && this.articleId) {
      this.articleService.update(this.articleId, article, this.selectedImageFile || undefined).subscribe({
        next: () => {
          this.handleAttachmentUpload(this.articleId!);
        },
        error: (err: any) => {
          console.warn('Error updating article:', err);
          if (err.status === 403) {
            console.warn("Access denied: user not article owner or insufficient role");
            this.error = "❌ You don't have permission to edit this article. Only the owner and admins can edit.";
          } else {
            console.error('Failed to update article:', err);
            this.error = 'Failed to update article';
          }
          this.submitting = false;
        }
      });
    } else {
      this.articleService.create(article, this.selectedImageFile || undefined).subscribe({
        next: (createdArticle: Article) => {
          this.handleAttachmentUpload(createdArticle.id || 0);
        },
        error: (err: any) => {
          console.warn('Error creating article:', err);
          if (err.status === 403) {
            console.warn("Access denied: user role not permitted to create articles");
            this.error = "❌ You don't have permission to create articles. Only dietitians and admins can create articles.";
          } else {
            console.error('Failed to create article:', err);
            this.error = 'Failed to create article';
          }
          this.submitting = false;
        }
      });
    }
  }

  private handleAttachmentUpload(articleId: number): void {
    if (this.selectedAttachmentFiles.length > 0) {
      this.uploadAttachments(articleId).then(() => {
        this.submitting = false;
        // TASK 4: Clear draft after successful article creation
        this.clearDraft();
        this.router.navigate(['/forum/detail', articleId]);
      }).catch(() => {
        this.error = 'Failed to upload some attachments. Article was saved but attachments may not be complete.';
        this.submitting = false;
      });
    } else {
      this.submitting = false;
      // TASK 4: Clear draft after successful article creation
      this.clearDraft();
      this.router.navigate(['/forum/detail', articleId]);
    }
  }

  cancel(): void {
    this.router.navigate(['/forum']);
  }

  get title() {
    return this.form.get('title');
  }

  get content() {
    return this.form.get('content');
  }

  get embedUrl() {
    return this.form.get('embedUrl');
  }

  private clearDraft(): void {
    localStorage.removeItem(this.DRAFT_KEY);
    this.draftRestored = false;
  }
}