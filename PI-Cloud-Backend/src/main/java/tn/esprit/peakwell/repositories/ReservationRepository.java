package tn.esprit.peakwell.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.peakwell.entities.Reservation;
import java.util.List;
import java.util.Optional;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    Optional<Reservation> findByUserIdAndDailyMenuId(String userId, Long menuId);

    int countByDailyMenuId(Long menuId);

    List<Reservation> findByUserId(String userId);

    long countByPlanIsNotNull();

    List<Reservation> findByPlanIsNotNull();
}
