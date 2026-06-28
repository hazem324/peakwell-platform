// PaymentResponse.java
package tn.esprit.peakwell.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data @Builder
public class PaymentResponse {
  private Long   id;
  private String payableType;
  private Long   payableId;
  private String payableLabel;
  private String stripePaymentIntentId;
  private Long   amount;
  private String currency;
  private String status;
  private String receiptUrl;
  private String invoiceNumber;
  private String failureReason;
  private LocalDateTime paidAt;
  private LocalDateTime refundedAt;
  private LocalDateTime createdAt;
}
