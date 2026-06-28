import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Comment } from '../models/comment.model';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private apiUrl = 'http://localhost:8090/peakwell/api/comments';

  constructor(private http: HttpClient) { }

  getCommentsByArticle(articleId: number): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.apiUrl}/article/${articleId}`);
  }

  addComment(articleId: number, comment: Omit<Comment, 'id' | 'articleId' | 'createdAt' | 'author'>): Observable<Comment> {
    return this.http.post<Comment>(`${this.apiUrl}/article/${articleId}`, comment).pipe(
      catchError((error) => {
        if (error.status === 400 && error.error?.error === 'INAPPROPRIATE_CONTENT') {
          return throwError(() => ({
            type: 'MODERATION_ERROR',
            category: error.error.category,
            detectedWords: error.error.detectedWords,
            message: error.error.userMessage
          }));
        }
        return throwError(() => error);
      })
    );
  }

  addReply(articleId: number, parentCommentId: number, comment: Omit<Comment, 'id' | 'articleId' | 'createdAt' | 'parentCommentId' | 'author'>): Observable<Comment> {
    return this.http.post<Comment>(`${this.apiUrl}/${articleId}/reply/${parentCommentId}`, comment).pipe(
      catchError((error) => {
        if (error.status === 400 && error.error?.error === 'INAPPROPRIATE_CONTENT') {
          return throwError(() => ({
            type: 'MODERATION_ERROR',
            category: error.error.category,
            detectedWords: error.error.detectedWords,
            message: error.error.userMessage
          }));
        }
        return throwError(() => error);
      })
    );
  }

  deleteComment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  voteComment(commentId: number, voteType: string, userIdentifier: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${commentId}/vote`, { voteType, userIdentifier });
  }
}