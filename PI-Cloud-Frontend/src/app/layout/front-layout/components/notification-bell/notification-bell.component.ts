import { Component, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationService, AppNotification } from '../../../../services/notification.service';

@Component({
  selector: 'app-notification-bell',
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.scss']
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  open = false;
  notifications: AppNotification[] = [];
  unreadCount = 0;
  private subs: Subscription[] = [];

  constructor(
    public notifService: NotificationService,
    private router: Router,
    private elRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.subs.push(
      this.notifService.notifications$.subscribe(n => this.notifications = n),
      this.notifService.unreadCount$.subscribe(c => this.unreadCount = c)
    );
  }

  ngOnDestroy(): void { this.subs.forEach(s => s.unsubscribe()); }

  toggle(): void {
    this.open = !this.open;
    if (this.open) this.notifService.refresh();
  }

  // Close on outside click
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.open = false;
    }
  }

  markRead(n: AppNotification): void {
    if (!n.read) {
      this.notifService.markAsRead(n.id).subscribe(() => this.notifService.refresh());
    }
  }

  markAllRead(): void {
    this.notifService.markAllAsRead().subscribe(() => this.notifService.refresh());
  }

  dismiss(n: AppNotification, event: Event): void {
    event.stopPropagation();
    this.notifService.dismiss(n.id).subscribe(() => this.notifService.refresh());
  }

  dismissAll(): void {
    this.notifService.dismissAll().subscribe(() => {
      this.notifService.refresh();
      this.open = false;
    });
  }

  navigate(n: AppNotification): void {
    this.markRead(n);
    if (n.actionUrl) {
      this.router.navigateByUrl(n.actionUrl).then(success => {
        if (!success) this.router.navigateByUrl('/dossier');
      });
      this.open = false;
    }
  }

  severityColor(s: string): string {
    const m: Record<string, string> = {
      CRITICAL: '#c96a3f', HIGH: '#e88f68', MEDIUM: '#e8b84b', LOW: '#7a9e7e'
    };
    return m[s] ?? '#b5aaa5';
  }

  timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return mins + 'm ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    const days = Math.floor(hrs / 24);
    return days + 'd ago';
  }
}