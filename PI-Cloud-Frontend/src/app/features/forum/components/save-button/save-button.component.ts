import { Component, Input, OnInit } from '@angular/core';
import { ArticleService } from '../../../../services/article.service';
import { UserForumService } from '../../../../services/user-forum.service';

@Component({
  selector: 'app-save-button',
  templateUrl: './save-button.component.html',
  styleUrl: './save-button.component.css'
})
export class SaveButtonComponent implements OnInit {
  @Input() articleId: number | null = null;

  isSaved: boolean = false;
  loading: boolean = false;
  userIdentifier: string = '';

  constructor(private articleService: ArticleService, private userForumService: UserForumService) { }

  ngOnInit(): void {
    this.userIdentifier = this.userForumService.getCurrentUserId();
    if (this.articleId) {
      this.checkIfSaved();
    }
  }

  checkIfSaved(): void {
    if (!this.articleId) return;

    this.loading = true;
    this.articleService.isSaved(this.articleId, this.userIdentifier).subscribe({
      next: (saved) => {
        this.isSaved = saved;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error checking saved status:', err);
        this.loading = false;
      }
    });
  }

  toggleSave(): void {
    if (!this.articleId) return;

    // Optimistic update
    this.isSaved = !this.isSaved;

    this.articleService.toggleSave(this.articleId, this.userIdentifier).subscribe({
      next: () => {
        // State is already updated optimistically
      },
      error: (err) => {
        console.error('Error toggling save:', err);
        // Revert on error
        this.isSaved = !this.isSaved;
      }
    });
  }

  getTooltip(): string {
    return this.isSaved ? 'Saved' : 'Save article';
  }
}