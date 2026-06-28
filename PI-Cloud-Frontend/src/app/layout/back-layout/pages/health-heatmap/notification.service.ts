import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';

export interface AppNotification {
  id: number;
  type: string;
  severity: string;
  title: string;
  message: string;
  icon: string;
  actionUrl: string;
  actionLabel: string;
  read: boolean;
  dismissed: boolean;
  createdAt: string;
  readAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private api = 'http://localhost:8090/peakwell/api/notifications';

  private notificationsSubject = new BehaviorSubject<AppNotification[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);

  notifications$ = this.notificationsSubject.asObservable();
  unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {
    this.startPolling();
  }

  // Poll every 60 seconds for new notifications
  private startPolling(): void {
    interval(60000).pipe(startWith(0)).subscribe(() => {
      this.refresh();
    });
  }

  refresh(): void {
    this.http.get<AppNotification[]>(this.api).subscribe({
      next: list => this.notificationsSubject.next(list),
      error: () => {}
    });
    this.http.get<{ count: number }>(`${this.api}/unread-count`).subscribe({
      next: r => this.unreadCountSubject.next(r.count),
      error: () => {}
    });
  }

  markAsRead(id: number): Observable<AppNotification> {
    return this.http.patch<AppNotification>(`${this.api}/${id}/read`, {});
  }

  markAllAsRead(): Observable<any> {
    return this.http.patch(`${this.api}/read-all`, {});
  }

  dismiss(id: number): Observable<any> {
    return this.http.delete(`${this.api}/${id}`);
  }

  dismissAll(): Observable<any> {
    return this.http.delete(`${this.api}/dismiss-all`);
  }

  triggerCheck(): Observable<AppNotification[]> {
    return this.http.post<AppNotification[]>(`${this.api}/check`, {});
  }
}