package tn.esprit.peakwell.repositories;

import tn.esprit.peakwell.entities.HealthGoal;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface HealthGoalRepository extends JpaRepository<HealthGoal, Long> {
  List<HealthGoal> findAllByOrderByCreatedAtDesc();
  List<HealthGoal> findByActiveTrueOrderByCreatedAtDesc();
  List<HealthGoal> findByProfileIdOrderByCreatedAtDesc(Long profileId);
  List<HealthGoal> findByActiveTrueAndProfileIdOrderByCreatedAtDesc(Long profileId);
  List<HealthGoal> findByMetric(String metric);
  List<HealthGoal> findAllByProfileIdOrderByCreatedAtDesc(Long profileId);

}