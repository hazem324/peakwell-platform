package tn.esprit.peakwell.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.peakwell.entities.SportEvent;
import tn.esprit.peakwell.enums.EventStatus;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SportEventRepository extends JpaRepository<SportEvent, Long> {

    @Modifying
    @Transactional
    @Query("UPDATE SportEvent e SET e.status = 'FINISHED' " +
            "WHERE e.eventDate < CURRENT_TIMESTAMP AND e.status <> 'FINISHED'")
    void updateExpiredEvents();
    List<SportEvent> findByEventDateAfterAndStatusNotAndStatusNot(LocalDateTime now, EventStatus status1, EventStatus status2);
    @Query("""
    SELECT e FROM SportEvent e
    WHERE e.eventDate > :now
      AND e.status <> tn.esprit.peakwell.enums.EventStatus.FINISHED
      AND e.status <> tn.esprit.peakwell.enums.EventStatus.CANCELLED
""")
    List<SportEvent> findAvailableFutureEvents(@Param("now") LocalDateTime now);

    List<SportEvent> findByStatusAndExportedToAiDatasetFalse(EventStatus status);


    @Modifying
    @Query("update SportEvent e set e.exportedToAiDataset = true where e.id = :id")
    void markAsExported(Long id);
}