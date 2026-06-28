package tn.esprit.peakwell.repositories;

import tn.esprit.peakwell.entities.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
  Optional<Payment> findByStripePaymentIntentId(String intentId);
  Optional<Payment> findByPayableTypeAndPayableId(String type, Long id);
  List<Payment> findByProfileIdOrderByCreatedAtDesc(Long profileId);
  List<Payment> findAllByOrderByCreatedAtDesc();
  List<Payment> findByPayableType(String type);
  List<Payment> findByStatus(String status);
  boolean existsByPayableTypeAndPayableIdAndStatus(String type, Long id, String status);
}
