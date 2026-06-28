import { Component, EventEmitter, OnInit, OnDestroy, Output, AfterViewChecked } from '@angular/core';
import { PaymentService, PayableType } from '../../../../dossier/services/payment.service'
import { ToastServiceService } from '../../../../../../services/toast-service.service';
import { HttpClient } from '@angular/common/http';
import { loadStripe, Stripe, StripeElements, StripePaymentElement } from '@stripe/stripe-js';

interface CheckoutItem {
  payableType: PayableType;
  label:       string;
  amount:      number;
  currency:    string;
}

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit, OnDestroy, AfterViewChecked {
  @Output() paymentDone = new EventEmitter<void>();

  items: CheckoutItem[] = [
    { payableType: 'CONSULTATION',   label: 'Consultation',         amount: 5000, currency: 'usd' },
    { payableType: 'SPORTS_EVENT',   label: 'Sports Event',         amount: 2000, currency: 'usd' },
    { payableType: 'NUTRITION_PLAN', label: 'Nutrition Plan',       amount: 9900, currency: 'usd' },
    { payableType: 'SUBSCRIPTION',   label: 'Monthly Subscription', amount: 1990, currency: 'usd' },
  ];

  selectedType: PayableType = 'CONSULTATION';
  selectedId   = 0;
  loading      = false;
  mountingCard = false;
  cardReady    = false;
  errorMessage = '';
  step: 'select' | 'card' | 'processing' | 'success' = 'select';

  unpaidConsultations: any[] = [];

  private stripe!: Stripe;
  private elements!: StripeElements;
  private paymentElement!: StripePaymentElement;
  private clientSecret  = '';
  private shouldMount   = false;  // flag: DOM is ready, mount now
  private hasMounted    = false;  // flag: already mounted, don't remount

  constructor(
    private paymentService: PaymentService,
    private toastService: ToastServiceService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.http.get<any[]>('http://localhost:8090/peakwell/api/consultations/upcoming').subscribe({
      next: list => this.unpaidConsultations = list,
      error: () => {}
    });
  }

  // Called after every change detection — mounts Stripe when div is in DOM
  ngAfterViewChecked(): void {
    if (this.shouldMount && !this.hasMounted) {
      const el = document.getElementById('stripe-element');
      if (el) {
        this.hasMounted = true;
        this.shouldMount = false;
        this.doMount();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroyElement();
  }

  private destroyElement(): void {
    try { this.paymentElement?.destroy(); } catch (_) {}
  }

  get selectedItem(): CheckoutItem {
    return this.items.find(i => i.payableType === this.selectedType)!;
  }

  selectType(type: PayableType): void {
    this.selectedType = type;
    this.selectedId   = 0;
  }

  // ── Step 1: create intent then switch to card step ───────────────────
async proceedToCard(): Promise<void> {
  if (this.selectedType === 'CONSULTATION' && !this.selectedId) {
    this.toastService.show('⚠️ Please select a consultation');
    return;
  }

  this.errorMessage = '';
  this.hasMounted   = false;
  this.cardReady    = false;
  this.mountingCard = true;

  try {
    const intent: any = await new Promise((resolve, reject) => {
      this.http.post('http://localhost:8090/peakwell/api/payments/create-intent', {
        payableType: this.selectedType,
        payableId:   this.selectedId || 1,
        amount:      this.selectedItem.amount
      }).subscribe({ next: resolve, error: reject });
    });

    this.clientSecret = intent.clientSecret;
    this.step = 'card';

    // div is already in DOM thanks to [hidden], mount immediately
    await this.doMount();

  } catch (e) {
    this.mountingCard = false;
    this.toastService.show('❌ Could not initiate payment.');
  }
}

  // ── Step 2: actually mount Stripe into the div ───────────────────────
  private async doMount(): Promise<void> {
    this.stripe = await loadStripe('pk_test_51TCpiOQRBlglb0TZaHmf6jiiu88nDWe5EAIHyvs9PEjsjmvZDIFTPUbG7kzEK1wHaj0rBdj9zeJ0BETmh7TJzkSv00aa1cEGVF') as Stripe;

    this.elements = this.stripe.elements({
      clientSecret: this.clientSecret,
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary:    '#c96a3f',
          colorBackground: '#faf7f4',
          colorText:       '#1e1a16',
          colorDanger:     '#c96a3f',
          fontFamily:      'Jost, sans-serif',
          borderRadius:    '10px',
        }
      }
    });

    this.destroyElement();
    this.paymentElement = this.elements.create('payment');
    this.paymentElement.mount('#stripe-element');

    this.paymentElement.on('ready', () => {
      this.mountingCard = false;
      this.cardReady    = true;
    });
  }

  // ── Step 3: confirm with Stripe ──────────────────────────────────────
  async confirmPayment(): Promise<void> {
    if (!this.stripe || !this.elements || !this.cardReady) {
      this.toastService.show('⚠️ Payment form is still loading, please wait.');
      return;
    }

    this.step         = 'processing';
    this.errorMessage = '';

    try {
      const { error, paymentIntent } = await this.stripe.confirmPayment({
        elements:      this.elements,
        confirmParams: { return_url: `${window.location.origin}/payment-success` },
        redirect:      'if_required',
      });

      if (error) {
        this.errorMessage = error.message ?? 'Payment failed.';
        this.step = 'card';
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        this.http.post('http://localhost:8090/peakwell/api/payments/confirm', {
          paymentIntentId: paymentIntent.id
        }).subscribe({
          next:  () => { this.step = 'success'; },
          error: () => { this.step = 'success'; }
        });
        return;
      }

      if (paymentIntent?.status === 'requires_action') {
        this.errorMessage = 'Additional authentication required. Please try again.';
        this.step = 'card';
        return;
      }

      this.errorMessage = `Unexpected status: ${paymentIntent?.status}`;
      this.step = 'card';

    } catch (e: any) {
      this.errorMessage = e?.message ?? 'Something went wrong.';
      this.step = 'card';
    }
  }

  // ── Success ──────────────────────────────────────────────────────────
  done(): void {
    this.step         = 'select';
    this.selectedId   = 0;
    this.clientSecret = '';
    this.hasMounted   = false;
    this.cardReady    = false;
    this.destroyElement();
    this.paymentDone.emit();
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
}