package tn.esprit.peakwell.controller;

import tn.esprit.peakwell.dto.*;
import tn.esprit.peakwell.services.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class PaymentController {

  private final PaymentService paymentService;

  @PostMapping("/create-intent")
  public ResponseEntity<Map<String, Object>> createIntent(
    @RequestBody PaymentRequest req) {
    return ResponseEntity.ok(paymentService.createPaymentIntent(req));
  }

  @PostMapping("/confirm")
  public ResponseEntity<PaymentResponse> confirm(
    @RequestBody Map<String, String> body) {
    return ResponseEntity.ok(
      paymentService.confirmPayment(body.get("paymentIntentId")));
  }

  @PostMapping("/refund")
  public ResponseEntity<PaymentResponse> refund(
    @RequestBody Map<String, Object> body) {
    return ResponseEntity.ok(paymentService.refund(
      (String) body.get("payableType"),
      Long.valueOf(body.get("payableId").toString())));
  }

  @GetMapping
  public ResponseEntity<List<PaymentResponse>> getAll() {
    return ResponseEntity.ok(paymentService.getAll());
  }

  @GetMapping("/type/{type}")
  public ResponseEntity<List<PaymentResponse>> getByType(
    @PathVariable String type) {
    return ResponseEntity.ok(paymentService.getByType(type));
  }

  @GetMapping("/status")
  public ResponseEntity<PaymentResponse> getStatus(
    @RequestParam String type,
    @RequestParam Long id) {
    return paymentService.getStatus(type, id)
      .map(ResponseEntity::ok)
      .orElse(ResponseEntity.notFound().build());
  }
}
