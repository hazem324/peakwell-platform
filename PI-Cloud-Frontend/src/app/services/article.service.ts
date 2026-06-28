import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Article, Page, SavedArticle } from '../models/article.model';

@Injectable({
  providedIn: 'root'
})
export class ArticleService {
  private apiUrl = 'http://localhost:8090/peakwell/articles';
  private savedArticlesUrl = 'http://localhost:8090/peakwell/api/saved-articles';

  constructor(private http: HttpClient) { }

  getAll(): Observable<Article[]> {
    return this.http.get<Article[]>(this.apiUrl);
  }

  getArticles(page: number = 0): Observable<Page<Article>> {
    return this.http.get<Page<Article>>(`${this.apiUrl}?page=${page}&size=3`);
  }

  getById(id: number): Observable<Article> {
    return this.http.get<Article>(`${this.apiUrl}/${id}`);
  }

  create(article: Article, imageFile?: File): Observable<Article> {
    const formData = new FormData();
    formData.append('title', article.title);
    formData.append('content', article.content);
    // Author is automatically set by backend from JWT/Keycloak
    if (article.embedUrl) {
      formData.append('embedUrl', article.embedUrl);
    }
    if (imageFile) {
      formData.append('image', imageFile);
    }
    return this.http.post<Article>(this.apiUrl, formData);
  }

  update(id: number, article: Article, imageFile?: File): Observable<Article> {
    const formData = new FormData();
    formData.append('title', article.title);
    formData.append('content', article.content);
    // Author is NOT modified - remains unchanged on backend
    if (article.embedUrl) {
      formData.append('embedUrl', article.embedUrl);
    }
    if (imageFile) {
      formData.append('image', imageFile);
    }
    return this.http.put<Article>(`${this.apiUrl}/${id}`, formData);
  }

  /**
   * FIX FOR BUG 3: Handle both external URLs and local image filenames
   * - If imageUrl is an external URL (http:// or https://), return as-is
   * - If imageUrl is a local filename (UUID or filename), construct backend URL
   * - If imageUrl is empty, return empty string
   */
  getImageUrl(imageUrl: string): string {
    if (!imageUrl) {
      return 'default-food.png';
    }

    // Already full URL (external image)
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }

    // Backend serves images via /articles/images/{filename} endpoint
    return `http://localhost:8090/peakwell/articles/images/${imageUrl}`;
  }
  /**
   * FIX FOR BUG 1: Enhanced error handling for DELETE request
   * The backend validates ownership - only article owners can delete
   * Error 400: Returned when user is not the article owner
   */
  delete(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      responseType: 'text'
    });
  }

  getByAuthor(author: string): Observable<Article[]> {
    return this.http.get<Article[]>(`${this.apiUrl}/author/${author}`);
  }

  searchByTitle(title: string): Observable<Article[]> {
    return this.http.get<Article[]>(`${this.apiUrl}/search/${title}`);
  }

  toggleSave(articleId: number, userIdentifier: string): Observable<void> {
    return this.http.post<void>(`${this.savedArticlesUrl}/toggle`, { articleId, userIdentifier });
  }

  getSavedArticles(userIdentifier: string): Observable<SavedArticle[]> {
    return this.http.get<SavedArticle[]>(`${this.savedArticlesUrl}/user/${userIdentifier}`);
  }

  isSaved(articleId: number, userIdentifier: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.savedArticlesUrl}/check/${articleId}/${userIdentifier}`);
  }

  searchArticles(params: {
    search?: string,
    author?: string,
    dateFilter?: string,
    sortBy?: string,
    page?: number,
    size?: number
  }): Observable<Page<Article>> {
    let queryParams = new HttpParams();
    if (params.search) {
      queryParams = queryParams.set('search', params.search);
    }
    if (params.author) {
      queryParams = queryParams.set('author', params.author);
    }
    if (params.dateFilter) {
      queryParams = queryParams.set('dateFilter', params.dateFilter);
    }
    if (params.sortBy) {
      queryParams = queryParams.set('sortBy', params.sortBy);
    }
    queryParams = queryParams.set('page', (params.page || 0).toString());
    queryParams = queryParams.set('size', (params.size || 9).toString());

    return this.http.get<Page<Article>>(`${this.apiUrl}/search`, { params: queryParams });
  }

    // ADD THIS METHOD AT THE END
  generateAI(articleId: number) {
    return this.http.post(`${this.apiUrl}/${articleId}/generate-ai`, {});
  }
}