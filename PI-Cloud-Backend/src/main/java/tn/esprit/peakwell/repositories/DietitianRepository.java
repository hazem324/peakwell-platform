package tn.esprit.peakwell.repositories;

import tn.esprit.peakwell.entities.Dietitian;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DietitianRepository extends JpaRepository<Dietitian, Long> {
    Optional<Dietitian> findFirstBy();
    Optional<Dietitian> findByUserId(Long userId);

}