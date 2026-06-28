import { Component, OnInit } from '@angular/core';
import { PaymentService, PayableType, PaymentRecord } from '../../../services/payment.service';

@Component({
  selector: 'app-payment-history',
  templateUrl: './payment-history.component.html',
  styleUrls: ['./payment-history.component.scss']
})
export class PaymentHistoryComponent implements OnInit {
  loading = true;
  payments: PaymentRecord[] = [];
  grouped: { month: string; items: PaymentRecord[] }[] = [];

  constructor(private paymentService: PaymentService) {}

  ngOnInit(): void {
    this.paymentService.getAll().subscribe({
      next: (p: PaymentRecord[]) => {
        this.payments = p;
        this.buildGroups();
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  private buildGroups(): void {
    const map = new Map<string, PaymentRecord[]>();
    for (const p of this.payments) {
      const d = new Date(p.createdAt);
      const key = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    this.grouped = Array.from(map.entries()).map(([month, items]) => ({ month, items }));
  }

  format(amount: number, currency: string): string {
    return this.paymentService.formatAmount(amount, currency);
  }

  typeIcon(type: string): string {
    const m: Record<string, string> = {
      CONSULTATION: '🩺', SPORTS_EVENT: '🏃',
      NUTRITION_PLAN: '🥗', SUBSCRIPTION: '⭐'
    };
    return m[type] ?? '💳';
  }

  typeLabel(type: string): string {
    const m: Record<string, string> = {
      CONSULTATION: 'Consultation', SPORTS_EVENT: 'Sports Event',
      NUTRITION_PLAN: 'Nutrition Plan', SUBSCRIPTION: 'Subscription'
    };
    return m[type] ?? type;
  }

  statusColor(s: string): string {
    const m: Record<string, string> = {
      PAID: '#7a9e7e', PENDING: '#4ab8f0', REFUNDED: '#e88f68', FAILED: '#c96a3f'
    };
    return m[s] ?? '#b5aaa5';
  }

  statusLabel(s: string): string {
    const m: Record<string, string> = {
      PAID: '✓ Paid', PENDING: '⏳ Pending', REFUNDED: '↩ Refunded', FAILED: '✗ Failed'
    };
    return m[s] ?? s;
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric'
    });
  }

  openReceipt(url: string): void { window.open(url, '_blank'); }
}