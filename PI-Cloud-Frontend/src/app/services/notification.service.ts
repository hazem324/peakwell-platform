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

  // Poll every 30 seconds: trigger backend check first, then fetch the results
  private startPolling(): void {
    interval(30000).pipe(startWith(0)).subscribe(() => {
      this.checkAndRefresh();
    });
  }

  private checkAndRefresh(): void {
    this.http.post<AppNotification[]>(`${this.api}/check`, {}).subscribe({
      next:  () => this.refresh(),
      error: () => this.refresh()
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

  triggerCheckForProfile(profileId: number): Observable<any> {
    return this.http.post(`${this.api}/check/${profileId}`, {});
  }

  sendGoalNotification(studentUserId: number, goalLabel: string): Observable<any> {
    return this.http.post(`${this.api}/send`, {
      userId:   studentUserId,
      type:     'GOAL_ASSIGNED',
      severity: 'INFO',
      title:    'New Goal Assigned',
      message:  `Your nutritionist has assigned you a new goal: ${goalLabel}`,
      icon:     '🎯',
      actionUrl: '/dossier'
    });
  }
}