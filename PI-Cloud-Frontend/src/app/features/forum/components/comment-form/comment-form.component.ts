import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { CommentService } from '../../../../services/comment.service';
import { UserForumService } from '../../../../services/user-forum.service';
import { Comment } from '../../../../models/comment.model';

@Component({
  selector: 'app-comment-form',
  templateUrl: './comment-form.component.html',
  styleUrl: './comment-form.component.css',
  animations: [
    trigger('slideUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(8px)' }),
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class CommentFormComponent implements OnInit {
  @Input() articleId: number | null = null;
  @Output() commentAdded = new EventEmitter<Comment>();

  form!: FormGroup;
  submitting: boolean = false;
  error: string = '';
  success: boolean = false;
  moderationError: string = '';
  moderationCategory: string = '';
  detectedWords: string[] = [];
  isSubmitting: boolean = false;

  constructor(
    private fb: FormBuilder,
    private commentService: CommentService,
    public userForumService: UserForumService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
  }

  initForm(): void {
    this.form = this.fb.group({
      content: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  onSubmit(): void {
    if (this.form.invalid || !this.articleId) {
      return;
    }

    this.isSubmitting = true;
    this.error = '';
    this.moderationError = '';
    this.success = false;

    const { content } = this.form.value;

    // Author is automatically set by backend from JWT/Keycloak
    this.commentService.addComment(this.articleId, { content }).subscribe({
      next: (comment: Comment) => {
        this.isSubmitting = false;
        this.success = true;
        this.form.reset();
        this.moderationError = '';
        this.commentAdded.emit(comment);

        // Hide success message after 3 seconds
        setTimeout(() => {
          this.success = false;
        }, 3000);
      },
      error: (err) => {
        this.isSubmitting = false;
        if (err.type === 'MODERATION_ERROR') {
          this.moderationError = err.message;
          this.moderationCategory = err.category;
          this.detectedWords = err.detectedWords || [];
          // Form is NOT cleared when blocked
        } else if (err.status === 403) {
          console.warn('Access denied: user role not permitted to comment');
          this.error = '❌ You don\'t have permission to comment on this article';
        } else {
          console.error('Error adding comment:', err);
          this.error = 'Failed to add comment';
        }
      }
    });
  }

  get content() {
    return this.form.get('content');
  }
}