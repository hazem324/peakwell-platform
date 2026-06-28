package tn.esprit.peakwell.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.peakwell.entities.EventReview;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventReviewRepository extends JpaRepository<EventReview, Long> {

    List<EventReview> findByStudent_Id(Long studentId);

    List<EventReview> findByEventId(Long eventId);

    Optional<EventReview> findByStudent_IdAndEventId(Long studentId, Long eventId);
}