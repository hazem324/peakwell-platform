package tn.esprit.peakwell.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.peakwell.entities.EventRegistration;
import tn.esprit.peakwell.enums.RegistrationStatus;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventRegistrationRepository extends JpaRepository<EventRegistration, Long> {

    List<EventRegistration> findByStudent_Id(Long studentId);

    List<EventRegistration> findByEventId(Long eventId);

    Optional<EventRegistration> findByStudent_IdAndEventId(Long studentId, Long eventId);

    Optional<EventRegistration> findFirstByEventIdAndStatusOrderByRegistrationDateAsc(
            Long eventId,
            RegistrationStatus status
    );

    @Modifying
    @Transactional
    @Query("""
        UPDATE EventRegistration r
        SET r.status = tn.esprit.peakwell.enums.RegistrationStatus.ATTENDED
        WHERE r.status = tn.esprit.peakwell.enums.RegistrationStatus.CONFIRMED
          AND r.event.eventDate < CURRENT_TIMESTAMP
          AND r.event.status = tn.esprit.peakwell.enums.EventStatus.FINISHED
    """)
    void updateConfirmedRegistrationsToAttended();

}