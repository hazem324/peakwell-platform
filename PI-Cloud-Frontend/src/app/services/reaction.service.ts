import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Reaction, ReactionCount } from '../models/reaction.model';

@Injectable({
  providedIn: 'root'
})
export class ReactionService {
  private apiUrl = 'http://localhost:8090/peakwell/api/reactions';

  constructor(private http: HttpClient) { }

  toggleReaction(articleId: number, type: string, userIdentifier: string): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/article/${articleId}`,
      { type, userIdentifier }
    );
  }

  getReactionCounts(articleId: number): Observable<{ [key: string]: number }> {
    return this.http.get<{ [key: string]: number }>(
      `${this.apiUrl}/article/${articleId}/count`
    );
  }

  getReactions(articleId: number): Observable<Reaction[]> {
    return this.http.get<Reaction[]>(
      `${this.apiUrl}/article/${articleId}`
    );
  }
}
