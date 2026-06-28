import { Component, OnInit } from '@angular/core';
import { PaymentService, PayableType, PaymentRecord } from '../../../dossier/services/payment.service';
import { ToastServiceService } from '../../../../../services/toast-service.service';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss']
})
export class PaymentComponent implements OnInit {
  view: 'history' | 'checkout' = 'history';
  loading = true;
  payments: PaymentRecord[] = [];
  filtered: PaymentRecord[] = [];

  filterType   = 'ALL';
  filterStatus = 'ALL';

  types    = ['ALL', 'CONSULTATION', 'SPORTS_EVENT', 'NUTRITION_PLAN', 'SUBSCRIPTION'];
  statuses = ['ALL', 'PAID', 'PENDING', 'REFUNDED', 'FAILED'];

  constructor(
    public paymentService: PaymentService,
    private toastService: ToastServiceService
  ) {}

  ngOnInit(): void { this.loadPayments(); }

  loadPayments(): void {
    this.loading = true;
    this.paymentService.getAll().subscribe({
      next: (p: PaymentRecord[]) => {
        this.payments = p;
        this.applyFilters();
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  applyFilters(): void {
    this.filtered = this.payments.filter(p =>
      (this.filterType   === 'ALL' || p.payableType === this.filterType) &&
      (this.filterStatus === 'ALL' || p.status      === this.filterStatus)
    );
  }

  refund(p: PaymentRecord): void {
    this.paymentService.refund(p.payableType as PayableType, p.payableId).subscribe({
      next: (updated: PaymentRecord) => {
        const idx = this.payments.findIndex(x => x.id === p.id);
        if (idx !== -1) this.payments[idx] = updated;
        this.applyFilters();
        this.toastService.show('💰 Refund processed successfully.');
      },
      error: () => this.toastService.show('❌ Refund failed.')
    });
  }

  openReceipt(url: string): void { window.open(url, '_blank'); }

  totalPaid(): number {
    return this.payments
      .filter(p => p.status === 'PAID')
      .reduce((sum, p) => sum + p.amount, 0);
  }

  totalRefunded(): number {
    return this.payments
      .filter(p => p.status === 'REFUNDED')
      .reduce((sum, p) => sum + p.amount, 0);
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
      PAID: '#7a9e7e', PENDING: '#4ab8f0',
      REFUNDED: '#e88f68', FAILED: '#c96a3f'
    };
    return m[s] ?? '#b5aaa5';
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    });
  }
}