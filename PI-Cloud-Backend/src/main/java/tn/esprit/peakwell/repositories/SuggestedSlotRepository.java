package tn.esprit.peakwell.repositories;

import tn.esprit.peakwell.entities.SuggestedSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SuggestedSlotRepository extends JpaRepository<SuggestedSlot, Long> {
  Optional<SuggestedSlot> findByToken(String token);
  List<SuggestedSlot> findByOriginalConsultationIdAndUsedFalse(Long consultationId);
}