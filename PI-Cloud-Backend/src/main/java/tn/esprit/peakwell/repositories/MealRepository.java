package tn.esprit.peakwell.repositories;

import tn.esprit.peakwell.entities.Meal;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MealRepository extends JpaRepository<Meal, Long> {
    List<Meal> findByCategory(String category);
    List<Meal> findByTags(String tags);
    List<Meal> findByCategoryIgnoreCase(String category);
    List<Meal> findByUserId(String userId);
}