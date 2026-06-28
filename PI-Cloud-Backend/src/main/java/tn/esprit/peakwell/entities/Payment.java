package tn.esprit.peakwell.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Payment {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "profile_id")
  private MedicalProfile profile;
  @OneToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "consultation_id", unique = true)
  private Consultation consultation;

  // What is being paid for
  @Column(nullable = false)
  private String payableType;   // CONSULTATION | SPORTS_EVENT | NUTRITION_PLAN | SUBSCRIPTION

  @Column(nullable = false)
  private Long payableId;       // FK to the related entity's ID

  private String payableLabel;  // human-readable: "Dr. Smith – Jun 15", "5K Run – July"

  // Stripe
  @Column(unique = true)
  private String stripePaymentIntentId;
  private String stripeChargeId;
  private String stripeRefundId;

  // Money
  @Column(nullable = false)
  private Long amount;          // in cents
  @Column(nullable = false)
  private String currency;

  @Builder.Default
  private String status = "PENDING"; // PENDING | PAID | REFUNDED | FAILED

  private String paymentMethod;
  private String receiptUrl;

  @Column(unique = true)
  private String invoiceNumber;  // PW-2025-00042

  @Column(columnDefinition = "TEXT")
  private String failureReason;

  private LocalDateTime paidAt;
  private LocalDateTime refundedAt;

  @Builder.Default
  private LocalDateTime createdAt = LocalDateTime.now();
}
