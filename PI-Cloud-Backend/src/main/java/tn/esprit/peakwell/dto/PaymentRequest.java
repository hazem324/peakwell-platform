// PaymentRequest.java
package tn.esprit.peakwell.dto;

import lombok.Data;

@Data
public class PaymentRequest {
  private String payableType;   // CONSULTATION | SPORTS_EVENT | NUTRITION_PLAN | SUBSCRIPTION
  private Long   payableId;
  private Long   amount;        // optional override; falls back to config default
  private String currency;      // optional override
}
