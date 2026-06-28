package tn.esprit.peakwell.repositories;

import tn.esprit.peakwell.entities.Ingredient;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IngredientRepository extends JpaRepository<Ingredient, Long> {
    boolean existsByProductId(Long productId);
}