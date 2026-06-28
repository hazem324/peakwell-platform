package tn.esprit.peakwell.repositories;

import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
import tn.esprit.peakwell.entities.MealPredictedAllergen;


public interface MealPredictedAllergenRepository extends JpaRepository<MealPredictedAllergen, Long> {

    @Query("SELECT m.predictedAllergens FROM MealPredictedAllergen m WHERE m.mealId = :mealId")
    Optional<String> findAllergensByMealId(@Param("mealId") Long mealId);
}

    
