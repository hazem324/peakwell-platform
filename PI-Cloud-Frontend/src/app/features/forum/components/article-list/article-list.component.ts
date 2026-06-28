import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ArticleService } from '../../../../services/article.service';
import { AuthService } from '../../../../services/auth.service';
import { Article, Page } from '../../../../models/article.model';
import { UserForumService } from '../../../../services/user-forum.service';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

@Component({
  selector: 'app-article-list',
  templateUrl: './article-list.component.html',
  styleUrl: './article-list.component.css'
})
export class ArticleListComponent implements OnInit, OnDestroy {
  articles: Article[] = [];
  loading: boolean = false;
  isAuthenticated: boolean = false;
  pastelColors = ['#FFE5D9', '#D9F0E3', '#FFE5F0', '#E5F0FF', '#FFF5D9'];

  // Pagination properties
  currentPage: number = 0;
  totalPages: number = 0;
  totalElements: number = 0;
  pageSize: number = 3;

  // Filter properties
  currentFilter: 'latest' | 'saved' = 'latest';

  // Search and filter properties
  searchQuery: string = '';
  selectedAuthor: string = '';
  selectedDateFilter: string = '';
  selectedSortBy: string = 'recent';
  isSearchActive: boolean = false;
  searchTimeout: any = null;

  // Error message for delete operation
  deleteErrorMessage: string = '';

  private destroy$ = new Subject<void>();
  errorMessage: string | undefined;

  constructor(
    private articleService: ArticleService,
    private router: Router,
    private authService: AuthService,
    public userForumService: UserForumService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.checkAuthentication();
    if (this.isAuthenticated) {
      this.loadArticles();
    }

    // Reload articles when navigating back to this component
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        filter((event: any) => event.url.includes('/forum') && !event.url.includes('/detail') && !event.url.includes('/edit') && !event.url.includes('/create')),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.checkAuthentication();
        if (this.isAuthenticated) {
          this.currentPage = 0;
          this.loadArticles();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.complete();
  }

  checkAuthentication(): void {
    this.isAuthenticated = this.authService.isAuthenticated();
    if (!this.isAuthenticated) {
      this.router.navigate(['/auth/login']);
    }
  }

  loadArticles(): void {
    this.loading = true;
    this.deleteErrorMessage = '';

    if (this.currentFilter === 'saved') {
      this.loadSavedArticles();
      return;
    }

    const hasFilters = this.searchQuery || this.selectedAuthor ||
                       this.selectedDateFilter || this.selectedSortBy !== 'recent';

    if (hasFilters) {
      this.isSearchActive = true;
      this.loadSearchResults();
    } else {
      this.isSearchActive = false;
      this.loadLatestArticles();
    }
  }

  private loadSearchResults(): void {
    this.articleService.searchArticles({
      search: this.searchQuery,
      author: this.selectedAuthor,
      dateFilter: this.selectedDateFilter,
      sortBy: this.selectedSortBy,
      page: this.currentPage,
      size: this.pageSize
    }).subscribe({
      next: (response: Page<Article>) => {
        this.articles = response.content;
        this.totalPages = response.totalPages;
        this.totalElements = response.totalElements;
        this.loading = false;
        this.scrollToTop();
      },
      error: (err) => {
        console.error('Search failed:', err);
        this.loading = false;
      }
    });
  }

  private loadLatestArticles(): void {
    this.articleService.getArticles(this.currentPage).subscribe({
      next: (response: Page<Article>) => {
        this.articles = response.content;
        // DEBUG: Log imageUrl values to inspect backend response
        this.articles.forEach((article, index) => {
          console.log(`[Article ${index}] id=${article.id}, imageUrl="${article.imageUrl}", ownerId="${article.ownerId}"`);
        });
        this.totalPages = response.totalPages;
        this.totalElements = response.totalElements;
        this.loading = false;
        this.scrollToTop();
      },
      error: (err) => {
        console.error('Error loading articles:', err);
        this.loading = false;
      }
    });
  }

  private loadSavedArticles(): void {
    // Get the actual Keycloak user ID from the JWT token
    const userId = this.userForumService.getCurrentUserId();

    if (!userId) {
      console.warn('Unable to load saved articles: user ID not found in JWT token');
      this.errorMessage = '❌ Unable to authenticate. Please log in again.';
      this.loading = false;
      return;
    }

    this.articleService.getSavedArticles(userId).subscribe({
      next: (savedArticles: any[]) => {
        // Map SavedArticleDTO to Article for display
        this.articles = savedArticles.map(item => ({
          id: item.articleId,
          title: item.articleTitle,
          content: '',
          author: item.articleAuthor,
          createdAt: item.articleCreatedAt,
          imageUrl: item.articleImageUrl,
          embedUrl: ''
        } as Article));
        this.totalPages = 1;
        this.totalElements = this.articles.length;
        this.loading = false;
        this.scrollToTop();
      },
      error: (err) => {
        if (err.status === 403) {
          console.warn('Unauthorized access to saved articles: user ID mismatch or insufficient permissions');
          this.errorMessage = '❌ You are not authorized to access these articles.';
        } else {
          console.error('Error loading saved articles:', err);
          this.errorMessage = '❌ Failed to load saved articles.';
        }
        this.loading = false;
      }
    });
  }

  setFilter(filter: 'latest' | 'saved'): void {
    if (this.currentFilter !== filter) {
      this.currentFilter = filter;
      this.currentPage = 0;
      this.loadArticles();
    }
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  goToPreviousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadArticles();
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadArticles();
    }
  }

  isPreviousDisabled(): boolean {
    return this.currentPage === 0;
  }

  isNextDisabled(): boolean {
    return this.currentPage >= this.totalPages - 1;
  }

  getBackgroundColor(index: number): string {
    return this.pastelColors[index % this.pastelColors.length];
  }

  /**
   * FIX FOR BUG 3: Delegate to service for proper URL handling
   * The service now handles external URLs vs local images
   */
  getImageUrl(imageUrl: string): string {
    return this.articleService.getImageUrl(imageUrl);
  }

  /**
   * FIX FOR BUG 2: Convert embed URL to safe iframe URL for video display
   * Supports YouTube and Vimeo URLs
   */
  convertEmbedUrl(url: string): SafeResourceUrl {
    if (!url) {
      return this.sanitizer.bypassSecurityTrustResourceUrl('');
    }

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

  /**
   * FIX FOR BUG 2: Check if URL is a video/embed URL that can be displayed
   */
  hasEmbedUrl(url: string): boolean {
    return !!(url && (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com')));
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return d.toLocaleDateString('en-US', options);
  }

  readArticle(id: any): void {
    console.log("CLICK VALUE:", id);
    this.router.navigate(['/forum/detail', id]);
  }

  editArticle(id: number | undefined): void {
    if (id) {
      this.router.navigate(['/forum/edit', id]);
    }
  }

  /**
   * FIX FOR BUG 1: Enhanced error handling for DELETE operation
   *
   * The backend validates article ownership - only the article owner can delete.
   * Additionally, role-based access control is enforced:
   * - DIETITIAN and ADMIN can delete their own articles
   * - STUDENT cannot delete articles
   *
   * Error scenarios:
   * - 403: User lacks sufficient role or is not the article owner
   * - 404: Article not found
   * - 500: Server error
   */
  deleteArticle(id: number) {

    if (!confirm("Are you sure you want to delete this article?")) return;

    this.articleService.delete(id).subscribe({
      next: () => {

        // ✅ 1. Remove instantly (good UX)
        this.articles = this.articles.filter(a => a.id !== id);

        // ✅ 2. 🔥 ADD THIS LINE HERE (VERY IMPORTANT)
        this.loadArticles();

        console.log("Article deleted and list refreshed");
      },
      error: (err) => {
        console.warn("Delete failed:", err);
        if (err.status === 403) {
          console.warn("Access denied: insufficient role or not article owner");
          this.errorMessage = "❌ You don't have permission to delete this article";
        } else if (err.status === 404) {
          console.warn("Article not found");
          this.errorMessage = "❌ Article not found";
          this.loadArticles(); // Refresh list to sync with backend
        } else {
          console.error("Failed to delete article:", err);
          this.errorMessage = "❌ Failed to delete article";
        }
      }
    });
  }
  createNewArticle(): void {
    this.router.navigate(['/forum/create']);
  }

  truncateContent(content: string, lines: number = 2): string {
    const contentLines = content.split('\n');
    return contentLines.slice(0, lines).join('\n') + (contentLines.length > lines ? '...' : '');
  }

  onSearchChange(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.currentPage = 0;
      this.loadArticles();
    }, 400);
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.loadArticles();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedAuthor = '';
    this.selectedDateFilter = '';
    this.selectedSortBy = 'recent';
    this.currentPage = 0;
    this.loadArticles();
  }

  hasActiveFilters(): boolean {
    return !!(this.searchQuery || this.selectedAuthor ||
              this.selectedDateFilter || this.selectedSortBy !== 'recent');
  }

  canEditArticle(article: Article): boolean {
    // ADMIN can edit any article, owner can edit their own
    return this.userForumService.hasRole('ADMIN') || this.userForumService.isOwner(article.ownerId);
  }

  canDeleteArticle(article: Article): boolean {
    // ADMIN can delete any article, owner can delete their own
    return this.userForumService.hasRole('ADMIN') || this.userForumService.isOwner(article.ownerId);
  }


}