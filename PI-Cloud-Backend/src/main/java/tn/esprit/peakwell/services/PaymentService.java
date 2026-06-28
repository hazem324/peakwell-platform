package tn.esprit.peakwell.services;

import com.stripe.Stripe;
import com.stripe.model.*;
import com.stripe.param.*;
import tn.esprit.peakwell.dto.*;
import tn.esprit.peakwell.entities.*;
import tn.esprit.peakwell.repositories.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

  private final PaymentRepository       paymentRepo;
  private final ConsultationRepository  consultRepo;
  private final MedicalProfileRepository profileRepo;

  @Value("${stripe.secret-key}")                  private String stripeKey;
  @Value("${payment.currency}")                   private String defaultCurrency;
  @Value("${payment.price.consultation}")         private Long priceConsultation;
  @Value("${payment.price.sports-event}")         private Long priceSportsEvent;
  @Value("${payment.price.nutrition-plan}")       private Long priceNutritionPlan;
  @Value("${payment.price.subscription.monthly}") private Long priceSubMonthly;
  @Value("${payment.price.subscription.yearly}")  private Long priceSubYearly;

  private static final Long PROFILE_ID = 1L;
  private static final AtomicLong invoiceCounter = new AtomicLong(1000);

  // ── Create PaymentIntent ─────────────────────────────────────────────

  @Transactional
  public Map<String, Object> createPaymentIntent(PaymentRequest req) {
    Stripe.apiKey = stripeKey;

    // Guard: already paid?
    if (paymentRepo.existsByPayableTypeAndPayableIdAndStatus(
      req.getPayableType(), req.getPayableId(), "PAID")) {
      throw new RuntimeException(req.getPayableType() + " #"
        + req.getPayableId() + " is already paid.");
    }

    long amount   = resolveAmount(req);
    String currency = req.getCurrency() != null ? req.getCurrency() : defaultCurrency;
    String label  = resolveLabel(req);
    MedicalProfile profile = profileRepo.findById(PROFILE_ID).orElse(null);

    try {
      PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
        .setAmount(amount)
        .setCurrency(currency)
        .setDescription(label)
        .putMetadata("payableType", req.getPayableType())
        .putMetadata("payableId",   req.getPayableId().toString())
        .putMetadata("profileId",   PROFILE_ID.toString())
        .setAutomaticPaymentMethods(
          PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
            .setEnabled(true).build())
        .build();

      PaymentIntent intent = PaymentIntent.create(params);

      // Upsert payment record
      Payment payment = paymentRepo
        .findByPayableTypeAndPayableId(req.getPayableType(), req.getPayableId())
        .orElse(Payment.builder()
          .profile(profile)
          .payableType(req.getPayableType())
          .payableId(req.getPayableId())
          .payableLabel(label)
          .amount(amount)
          .currency(currency)
          .invoiceNumber(generateInvoiceNumber())
          .build());

      payment.setStripePaymentIntentId(intent.getId());
      payment.setStatus("PENDING");
      paymentRepo.save(payment);

      return Map.of(
        "clientSecret",     intent.getClientSecret(),
        "paymentIntentId",  intent.getId(),
        "amount",           amount,
        "currency",         currency,
        "invoiceNumber",    payment.getInvoiceNumber(),
        "label",            label
      );

    } catch (Exception e) {
      log.error("Stripe createIntent error: {}", e.getMessage());
      throw new RuntimeException("Payment creation failed: " + e.getMessage());
    }
  }

  // ── Confirm (called by Angular after Stripe succeeds) ────────────────

  @Transactional
  public PaymentResponse confirmPayment(String paymentIntentId) {
    Stripe.apiKey = stripeKey;
    Payment payment = paymentRepo.findByStripePaymentIntentId(paymentIntentId)
      .orElseThrow(() -> new RuntimeException("Payment record not found"));

    try {
      PaymentIntent intent = PaymentIntent.retrieve(paymentIntentId);

      if ("succeeded".equals(intent.getStatus())) {
        payment.setStatus("PAID");
        payment.setPaidAt(LocalDateTime.now());
        payment.setPaymentMethod("card");

        if (intent.getLatestCharge() != null) {
          Charge charge = Charge.retrieve(intent.getLatestCharge());
          payment.setStripeChargeId(charge.getId());
          payment.setReceiptUrl(charge.getReceiptUrl());
        }

        // Side-effects per payable type
        handlePostPayment(payment);

      } else {
        payment.setStatus("FAILED");
        payment.setFailureReason(intent.getStatus());
      }

      return toResponse(paymentRepo.save(payment));

    } catch (Exception e) {
      log.error("Stripe confirm error: {}", e.getMessage());
      throw new RuntimeException("Confirmation failed: " + e.getMessage());
    }
  }

  // ── Refund ───────────────────────────────────────────────────────────

  @Transactional
  public PaymentResponse refund(String payableType, Long payableId) {
    Stripe.apiKey = stripeKey;
    Payment payment = paymentRepo
      .findByPayableTypeAndPayableId(payableType, payableId)
      .orElseThrow(() -> new RuntimeException("No payment found"));

    if (!"PAID".equals(payment.getStatus()))
      throw new RuntimeException("Only PAID items can be refunded");

    try {
      Refund refund = Refund.create(
        RefundCreateParams.builder()
          .setCharge(payment.getStripeChargeId())
          .build());

      payment.setStripeRefundId(refund.getId());
      payment.setStatus("REFUNDED");
      payment.setRefundedAt(LocalDateTime.now());

      return toResponse(paymentRepo.save(payment));

    } catch (Exception e) {
      log.error("Stripe refund error: {}", e.getMessage());
      throw new RuntimeException("Refund failed: " + e.getMessage());
    }
  }

  // ── Queries ──────────────────────────────────────────────────────────

  public List<PaymentResponse> getAll() {
    return paymentRepo.findAllByOrderByCreatedAtDesc()
      .stream().map(this::toResponse).collect(Collectors.toList());
  }

  public List<PaymentResponse> getByType(String type) {
    return paymentRepo.findByPayableType(type)
      .stream().map(this::toResponse).collect(Collectors.toList());
  }

  public Optional<PaymentResponse> getStatus(String type, Long id) {
    return paymentRepo.findByPayableTypeAndPayableId(type, id)
      .map(this::toResponse);
  }

  // ── Helpers ──────────────────────────────────────────────────────────

  private long resolveAmount(PaymentRequest req) {
    if (req.getAmount() != null && req.getAmount() > 0) return req.getAmount();
    return switch (req.getPayableType()) {
      case "CONSULTATION"   -> priceConsultation;
      case "SPORTS_EVENT"   -> priceSportsEvent;
      case "NUTRITION_PLAN" -> priceNutritionPlan;
      case "SUBSCRIPTION"   -> priceSubMonthly;
      default -> throw new RuntimeException("Unknown payable type: " + req.getPayableType());
    };
  }

  private String resolveLabel(PaymentRequest req) {
    return switch (req.getPayableType()) {
      case "CONSULTATION" -> consultRepo.findById(req.getPayableId())
        .map(c -> "Consultation – Dr. " + c.getDoctorName())
        .orElse("Consultation #" + req.getPayableId());
      case "SPORTS_EVENT"   -> "Sports Event #" + req.getPayableId();
      case "NUTRITION_PLAN" -> "Nutrition Plan #" + req.getPayableId();
      case "SUBSCRIPTION"   -> "PeakWell Subscription";
      default -> req.getPayableType() + " #" + req.getPayableId();
    };
  }

  private void handlePostPayment(Payment payment) {
    // Hook: mark consultation as confirmed, activate subscription, etc.
    if ("CONSULTATION".equals(payment.getPayableType())) {
      consultRepo.findById(payment.getPayableId()).ifPresent(c -> {
        if ("UPCOMING".equals(c.getStatus())) {
          c.setStatus("CONFIRMED");
          consultRepo.save(c);
        }
      });
    }
    // Add similar hooks for SPORTS_EVENT, SUBSCRIPTION, NUTRITION_PLAN
  }

  private String generateInvoiceNumber() {
    return "PW-" + LocalDateTime.now().getYear() + "-"
      + String.format("%05d", invoiceCounter.incrementAndGet());
  }

  private PaymentResponse toResponse(Payment p) {
    return PaymentResponse.builder()
      .id(p.getId())
      .payableType(p.getPayableType())
      .payableId(p.getPayableId())
      .payableLabel(p.getPayableLabel())
      .stripePaymentIntentId(p.getStripePaymentIntentId())
      .amount(p.getAmount())
      .currency(p.getCurrency())
      .status(p.getStatus())
      .receiptUrl(p.getReceiptUrl())
      .invoiceNumber(p.getInvoiceNumber())
      .failureReason(p.getFailureReason())
      .paidAt(p.getPaidAt())
      .refundedAt(p.getRefundedAt())
      .createdAt(p.getCreatedAt())
      .build();
  }
}
