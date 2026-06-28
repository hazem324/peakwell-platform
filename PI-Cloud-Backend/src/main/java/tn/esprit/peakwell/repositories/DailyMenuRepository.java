package tn.esprit.peakwell.repositories;

import tn.esprit.peakwell.entities.DailyMenu;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DailyMenuRepository extends JpaRepository<DailyMenu, Long>{
    Optional<DailyMenu> findByDate(LocalDate date);
    List<DailyMenu> findByDateBetween(LocalDate start, LocalDate end);
    long countByDateBetween(LocalDate start, LocalDate end);
    boolean existsByBreakfastId(Long id);
    boolean existsByLunchId(Long id);
    boolean existsByDinnerId(Long id);
}
