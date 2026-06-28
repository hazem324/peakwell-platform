import { Component, Input, OnInit } from '@angular/core';
import { PaymentService, PayableType, PaymentRecord } from '../../../../dossier/services/payment.service';

@Component({
  selector: 'app-invoice',
  templateUrl: './invoice.component.html',
  styleUrls: ['./invoice.component.scss']
})
export class InvoiceComponent implements OnInit {
  @Input() payableType!: PayableType;
  @Input() payableId!: number;

  payment: PaymentRecord | null = null;

  constructor(private paymentService: PaymentService) {}

  ngOnInit(): void {
    this.paymentService.getStatus(this.payableType, this.payableId).subscribe({
      next: p => this.payment = p,
      error: () => {}
    });
  }

  print(): void { window.print(); }

  openReceipt(): void {
    if (this.payment?.receiptUrl) window.open(this.payment.receiptUrl, '_blank');
  }

  format(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: currency.toUpperCase()
    }).format(amount / 100);
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }
}