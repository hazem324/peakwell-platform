package tn.esprit.peakwell.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import tn.esprit.peakwell.entities.Restaurant;

public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {
}
