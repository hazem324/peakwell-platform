import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { firstValueFrom, Observable } from 'rxjs';


export type PayableType =
  'CONSULTATION' | 'SPORTS_EVENT' | 'NUTRITION_PLAN' | 'SUBSCRIPTION';

export interface PaymentRecord {
  id:                   number;
  payableType:          PayableType;
  payableId:            number;
  payableLabel:         string;
  stripePaymentIntentId: string;
  amount:               number;
  currency:             string;
  status:               'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED';
  receiptUrl:           string;
  invoiceNumber:        string;
  failureReason:        string;
  paidAt:               string;
  refundedAt:           string;
  createdAt:            string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {

  private api = 'http://localhost:8090/peakwell/api/payments';
  private stripe$ = loadStripe('pk_test_51TCpiOQRBlglb0TZaHmf6jiiu88nDWe5EAIHyvs9PEjsjmvZDIFTPUbG7kzEK1wHaj0rBdj9zeJ0BETmh7TJzkSv00aa1cEGVF');

  constructor(private http: HttpClient) {}

  // ── Stripe checkout flow ─────────────────────────────────────────────

  async pay(
    payableType: PayableType,
    payableId: number,
    amount?: number
  ): Promise<'success' | 'cancelled' | 'error'> {

    const stripe = await this.stripe$ as Stripe;

    // 1. Create PaymentIntent on backend
    const intent: any = await firstValueFrom(
      this.http.post(`${this.api}/create-intent`, { payableType, payableId, amount })
    );

    // 2. Show Stripe card UI
    const result = await stripe.confirmPayment({
      clientSecret: intent.clientSecret,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success`,
      },
      redirect: 'if_required',
    });

    if (result.error) return 'error';

    // 3. Confirm on backend
    if (result.paymentIntent?.status === 'succeeded') {
      await firstValueFrom(
        this.http.post(`${this.api}/confirm`, {
          paymentIntentId: result.paymentIntent.id,
        })
      );
      return 'success';
    }

    return 'cancelled';
  }

  // ── REST calls ───────────────────────────────────────────────────────

  getAll(): Observable<PaymentRecord[]> {
    return this.http.get<PaymentRecord[]>(this.api);
  }

  getByType(type: PayableType): Observable<PaymentRecord[]> {
    return this.http.get<PaymentRecord[]>(`${this.api}/type/${type}`);
  }

  getStatus(payableType: PayableType, payableId: number): Observable<PaymentRecord> {
    return this.http.get<PaymentRecord>(
      `${this.api}/status?type=${payableType}&id=${payableId}`
    );
  }

  refund(payableType: PayableType, payableId: number): Observable<PaymentRecord> {
    return this.http.post<PaymentRecord>(`${this.api}/refund`, {
      payableType,
      payableId,
    });
  }

  // ── Utility ──────────────────────────────────────────────────────────

  formatAmount(cents: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  }
}