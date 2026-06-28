package tn.esprit.peakwell.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.peakwell.entities.Favorite;
import java.util.List;

import java.util.Optional;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

    Optional<Favorite> findByMealId(Long mealId);

    Optional<Favorite> findByMealIdAndUserId(Long mealId, String userId);

    List<Favorite> findByUserId(String userId);
}