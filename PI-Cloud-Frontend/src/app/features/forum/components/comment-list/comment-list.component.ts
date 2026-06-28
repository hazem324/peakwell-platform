import { Component, Input, OnInit } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { CommentService } from '../../../../services/comment.service';
import { UserForumService } from '../../../../services/user-forum.service';
import { Comment } from '../../../../models/comment.model';

@Component({
  selector: 'app-comment-list',
  templateUrl: './comment-list.component.html',
  styleUrl: './comment-list.component.css',
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(16px)' }),
        animate('600ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('slideDown', [
      transition(':enter', [
        style({ opacity: 0, maxHeight: 0, marginTop: 0 }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, maxHeight: '500px', marginTop: '16px' }))
      ])
    ])
  ]
})
export class CommentListComponent implements OnInit {
  @Input() articleId!: number;
  comments: Comment[] = [];
  loading: boolean = false;
  error: string = '';

  // Reply and voting properties
  replyingToId: number | null = null;
  replyContent: string = '';
  userVotes: Map<number, string> = new Map();

  constructor(private commentService: CommentService, public userForumService: UserForumService) {}

  ngOnInit(): void {
    if (this.articleId) {
      this.loadComments();
    }
  }

  loadComments(): void {
    if (!this.articleId) return;

    this.loading = true;
    this.error = '';
    this.commentService.getCommentsByArticle(this.articleId).subscribe({
      next: (comments) => {
        this.comments = comments;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading comments:', err);
        this.error = 'Failed to load comments';
        this.loading = false;
      }
    });
  }

  canDeleteComment(comment: Comment): boolean {
    // ADMIN can delete any comment, owner can delete their own
    return this.userForumService.hasRole('ADMIN') || this.userForumService.isOwner(comment.ownerId);
  }

  deleteComment(id: number | undefined): void {
    if (!id || !confirm('Are you sure you want to delete this comment?')) return;

    this.commentService.deleteComment(id).subscribe({
      next: () => {
        this.removeCommentById(id);
      },
      error: (err) => {
        console.warn('Error deleting comment:', err);
        if (err.status === 403) {
          console.warn("Access denied: user not comment owner or insufficient role");
          this.error = '❌ You don\'t have permission to delete this comment';
        } else {
          console.error('Failed to delete comment:', err);
          this.error = 'Failed to delete comment';
        }
      }
    });
  }

  private removeCommentById(id: number): void {
    // Remove from main list
    this.comments = this.comments.filter(c => c.id !== id);
    // Remove from all nested replies
    this.comments.forEach(comment => {
      if (comment.replies) {
        comment.replies = comment.replies.filter(r => r.id !== id);
      }
    });
  }

  showReplyForm(commentId: number | undefined): void {
    if (commentId === undefined || commentId === null) return;
    this.replyingToId = commentId;
  }

  cancelReply(): void {
    this.replyingToId = null;
    this.replyContent = '';
  }

  submitReply(parentComment: Comment): void {
    if (!this.articleId || !parentComment.id || !this.replyContent.trim()) {
      return;
    }

    const replyData = {
      content: this.replyContent
      // Author is automatically set by backend from JWT/Keycloak
    };

    this.commentService.addReply(
      this.articleId,
      parentComment.id,
      replyData
    ).subscribe({
      next: (newReply) => {
        // Add reply to parent comment instantly
        if (!parentComment.replies) {
          parentComment.replies = [];
        }
        parentComment.replies.push(newReply);

        // Clear form and close reply UI
        this.cancelReply();
      },
      error: (err) => {
        console.warn('Error submitting reply:', err);
        if (err.status === 403) {
          console.warn("Access denied: user role not permitted to reply");
          this.error = '❌ You don\'t have permission to reply to comments';
        } else {
          console.error('Failed to submit reply:', err);
          this.error = 'Failed to submit reply';
        }
      }
    });
  }

  voteComment(comment: Comment, voteType: 'UPVOTE' | 'DOWNVOTE'): void {
    if (!comment.id) return;

    const currentVote = this.userVotes.get(comment.id);

    // Optimistic update
    if (currentVote === voteType) {
      // Toggle off - same vote removes it
      if (voteType === 'UPVOTE') {
        comment.upvotes = (comment.upvotes || 1) - 1;
      } else {
        comment.downvotes = (comment.downvotes || 1) - 1;
      }
      this.userVotes.delete(comment.id);
    } else if (currentVote && currentVote !== voteType) {
      // Switch vote
      if (currentVote === 'UPVOTE') {
        comment.upvotes = (comment.upvotes || 1) - 1;
      } else {
        comment.downvotes = (comment.downvotes || 1) - 1;
      }

      if (voteType === 'UPVOTE') {
        comment.upvotes = (comment.upvotes || 0) + 1;
      } else {
        comment.downvotes = (comment.downvotes || 0) + 1;
      }
      this.userVotes.set(comment.id, voteType);
    } else {
      // New vote
      if (voteType === 'UPVOTE') {
        comment.upvotes = (comment.upvotes || 0) + 1;
      } else {
        comment.downvotes = (comment.downvotes || 0) + 1;
      }
      this.userVotes.set(comment.id, voteType);
    }

    // Send vote to backend with JWT-based user ID
    const userId = this.userForumService.getCurrentUserId();
    this.commentService.voteComment(comment.id, voteType, userId).subscribe({
      error: (err) => {
        console.warn('Error voting comment:', err);
        if (err.status === 403) {
          console.warn("Access denied: user role not permitted to vote");
          this.error = '❌ You don\'t have permission to vote on comments';
        } else {
          console.error('Failed to vote on comment:', err);
          this.error = 'Failed to vote on comment';
        }
        // Reload comments on vote error to sync with backend
        this.loadComments();
      }
    });
  }

  getUserVote(commentId: number | undefined): string | null {
    if (commentId === undefined || commentId === null) return null;
    return this.userVotes.get(commentId) || null;
  }

  getNetVotes(comment: Comment): number {
    return (comment.upvotes || 0) - (comment.downvotes || 0);
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return d.toLocaleDateString('en-US', options);
  }

  addCommentToList(comment: Comment): void {
    this.comments.unshift(comment);
  }

  removeCommentFromList(id: number | undefined): void {
    if (id) {
      this.removeCommentById(id);
    }
  }

  onCommentAdded(): void {
    this.loadComments();
  }


}