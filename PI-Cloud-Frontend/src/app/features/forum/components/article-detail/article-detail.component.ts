import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { trigger, transition, style, animate } from '@angular/animations';
import { ArticleService } from '../../../../services/article.service';
import { AuthService } from '../../../../services/auth.service';
import { UserForumService } from '../../../../services/user-forum.service';
import { Article } from '../../../../models/article.model';
import { Comment } from '../../../../models/comment.model';
import { CommentListComponent } from '../comment-list/comment-list.component';

@Component({
  selector: 'app-article-detail',
  templateUrl: './article-detail.component.html',
  styleUrl: './article-detail.component.css',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(16px)' }),
        animate('600ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class ArticleDetailComponent implements OnInit {
  @ViewChild(CommentListComponent) commentListComponent!: CommentListComponent;

  article: Article | null = null;
  articleId: number | null = null;
  loading: boolean = false;
  error: string = '';
  embedIframeUrl: SafeResourceUrl | null = null;
  isGeneratingAI: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private articleService: ArticleService,
    private sanitizer: DomSanitizer,
    private authService: AuthService,
    public userForumService: UserForumService
  ) { }

  ngOnInit(): void {
    // Check authentication before allowing access
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.articleId = Number(id);
      this.loadArticle(this.articleId);
    }
  }

  loadArticle(id: number): void {
    this.loading = true;
    this.articleService.getById(id).subscribe({
      next: (article) => {
        this.article = article;
        if (article.embedUrl) {
          this.embedIframeUrl = this.convertEmbedUrl(article.embedUrl);
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading article:', err);
        this.error = 'Failed to load article';
        this.loading = false;
      }
    });
  }

  convertEmbedUrl(url: string): SafeResourceUrl {
    let embedUrl = url;

    // Handle YouTube URLs
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = '';
      if (url.includes('youtube.com/watch?v=')) {
        videoId = url.split('v=')[1].split('&')[0];
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split('?')[0];
      }
      if (videoId) {
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      }
    }
    // Handle Vimeo URLs
    else if (url.includes('vimeo.com')) {
      const videoId = url.split('vimeo.com/')[1].split('?')[0];
      if (videoId) {
        embedUrl = `https://player.vimeo.com/video/${videoId}`;
      }
    }

    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  onCommentAdded(comment: Comment): void {
    if (this.commentListComponent) {
      this.commentListComponent.addCommentToList(comment);
    }
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return d.toLocaleDateString('en-US', options);
  }

  truncateUrl(url: string): string {
    if (!url) return '';
    try {
      const urlObj = new URL(url);
      return urlObj.hostname + (urlObj.pathname ? urlObj.pathname : '');
    } catch (e) {
      return url.length > 50 ? url.substring(0, 50) + '...' : url;
    }
  }

  getImageUrl(imageUrl: string): string {
    if (!imageUrl) {
      return 'default-food.png';
    }
    // Already a full URL (external image like YouTube thumbnail)
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    // Backend serves images via /articles/images/{filename} endpoint
    return `http://localhost:8090/peakwell/articles/images/${imageUrl}`;
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = 'default-food.png';
  }

  canEditArticle(): boolean {
    return this.article?.ownerId
      ? this.userForumService.isOwner(this.article.ownerId)
      : false;
  }

  goBack(): void {
    this.router.navigate(['/forum']);
  }

  editArticle(): void {
    if (this.article?.id) {
      this.router.navigate(['/forum/edit', this.article.id]);
    }
  }

  deleteArticle(): void {
    if (this.article?.id && confirm('Are you sure you want to delete this article?')) {
      this.loading = true;
  
      this.articleService.delete(this.article.id).subscribe({
        next: () => {
          // ✅ Navigate to forum after successful delete
          this.router.navigate(['/forum']);
  
          console.log("Article deleted successfully");
        },
        error: (err) => {
          console.error('Error deleting article:', err);
          this.loading = false;
          this.error = 'Failed to delete article. Please try again.';
        }
      });
    }
  }

  generateAIContent(): void {
    if (!this.article?.id) return;
  
    this.isGeneratingAI = true;
  
    this.articleService.generateAI(this.article.id).subscribe({
      next: () => {
        // 🔥 Reload article to get AI summary + tags
        this.loadArticle(this.article!.id!);
        this.isGeneratingAI = false;
      },
      error: (err) => {
        console.error('AI generation failed:', err);
        this.isGeneratingAI = false;
      }
    });
  }


}