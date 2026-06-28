import { Component, Input, OnInit } from '@angular/core';
import { PaymentService, PayableType, PaymentRecord } from '../../../../dossier/services/payment.service';

@Component({
  selector: 'app-payment-status',
  templateUrl: './payment-status.component.html',
  styleUrls: ['./payment-status.component.scss']
})
export class PaymentStatusComponent implements OnInit {
  @Input() payableType!: PayableType;
  @Input() payableId!: number;

  payment: PaymentRecord | null = null;

  constructor(private paymentService: PaymentService) {}

 ngOnInit(): void {
  this.paymentService.getStatus(this.payableType, this.payableId).subscribe({
    next: (p: PaymentRecord) => this.payment = p,
    error: () => {}
  });
}

  statusColor(s: string): string {
    const m: Record<string, string> = {
      PAID: '#7a9e7e', PENDING: '#4ab8f0',
      REFUNDED: '#e88f68', FAILED: '#c96a3f'
    };
    return m[s] ?? '#b5aaa5';
  }
}