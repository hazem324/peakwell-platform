package tn.esprit.peakwell.repositories;

import tn.esprit.peakwell.entities.ConsultationFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface FeedbackRepository extends JpaRepository<ConsultationFeedback, Long> {
  Optional<ConsultationFeedback> findByConsultationId(Long consultationId);
}
