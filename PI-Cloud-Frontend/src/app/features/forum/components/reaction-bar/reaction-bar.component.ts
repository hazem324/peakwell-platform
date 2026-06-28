import { Component, Input, OnInit } from '@angular/core';
import { ReactionService } from '../../../../services/reaction.service';
import { UserForumService } from '../../../../services/user-forum.service';
import { ReactionCount } from '../../../../models/reaction.model';

@Component({
  selector: 'app-reaction-bar',
  templateUrl: './reaction-bar.component.html',
  styleUrl: './reaction-bar.component.css'
})
export class ReactionBarComponent implements OnInit {
  @Input() articleId: number | null = null;

  reactions: { [key: string]: number } = {};
  userReaction: string | null = null;
  loading: boolean = false;

  reactionConfig = [
    { type: 'LIKE', label: 'Like', emoji: '👍' },
    { type: 'LOVE', label: 'Love', emoji: '❤️' },
    { type: 'INSIGHTFUL', label: 'Insightful', emoji: '🎯' },
    { type: 'IDEA', label: 'Idea', emoji: '💡' },
    { type: 'BRAVO', label: 'Bravo', emoji: '👏' }
  ];

  constructor(private reactionService: ReactionService, private userForumService: UserForumService) { }

  ngOnInit(): void {
    if (this.articleId) {
      this.loadReactions();
    }
  }

  loadReactions(): void {
    if (!this.articleId) return;

    this.loading = true;
    this.reactionService.getReactionCounts(this.articleId).subscribe({
      next: (counts) => {
        this.reactions = counts;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading reactions:', err);
        this.loading = false;
      }
    });

    // Load user's current reaction using JWT-based user ID
    this.reactionService.getReactions(this.articleId).subscribe({
      next: (reactions) => {
        const userId = this.userForumService.getCurrentUserId();
        const userReaction = reactions.find(r => r.userIdentifier === userId);
        if (userReaction) {
          this.userReaction = userReaction.type;
        }
      },
      error: (err) => {
        console.error('Error loading user reaction:', err);
      }
    });
  }

  toggleReaction(type: string): void {
    if (!this.articleId) return;

    const wasActive = this.userReaction === type;
    const previousReaction = this.userReaction;

    // Optimistic update
    if (wasActive) {
      // Remove reaction
      this.reactions[type] = Math.max(0, (this.reactions[type] || 1) - 1);
      this.userReaction = null;
    } else {
      // Add or change reaction
      if (previousReaction) {
        this.reactions[previousReaction] = Math.max(0, (this.reactions[previousReaction] || 1) - 1);
      }
      this.reactions[type] = (this.reactions[type] || 0) + 1;
      this.userReaction = type;
    }

    // Call API with JWT-based user ID
    const userId = this.userForumService.getCurrentUserId();
    this.reactionService.toggleReaction(this.articleId, type, userId).subscribe({
      next: () => {
        // Refresh from API to confirm
        this.loadReactions();
      },
      error: (err) => {
        console.error('Error toggling reaction:', err);
        // Revert optimistic update on error
        this.userReaction = previousReaction;
        this.loadReactions();
      }
    });
  }



  getReactionCount(type: string): number {
    return this.reactions[type] || 0;
  }

  isUserReaction(type: string): boolean {
    return this.userReaction === type;
  }
}