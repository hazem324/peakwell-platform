package tn.esprit.peakwell.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.peakwell.entities.Notification;

import java.time.LocalDateTime;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

  List<Notification> findAllByProfileIdAndDismissedFalseOrderByCreatedAtDesc(Long profileId);

  List<Notification> findAllByProfileIdOrderByCreatedAtDesc(Long profileId);

  List<Notification> findAllByDismissedFalseOrderByCreatedAtDesc();

  long countByProfileIdAndReadFalseAndDismissedFalse(Long profileId);

  long countByReadFalseAndDismissedFalse();

  // Prevent duplicate alerts — check if same type+title exists in last 24h
  boolean existsByProfileIdAndTypeAndTitleAndCreatedAtAfter(
    Long profileId, String type, String title, LocalDateTime after);

  // ── Dietitian-scoped queries ─────────────────────
  List<Notification> findAllByDietitianIdAndDismissedFalseOrderByCreatedAtDesc(Long dietitianId);
  long countByDietitianIdAndReadFalseAndDismissedFalse(Long dietitianId);
  boolean existsByDietitianIdAndTypeAndTitleAndCreatedAtAfter(
    Long dietitianId, String type, String title, LocalDateTime after);
}
