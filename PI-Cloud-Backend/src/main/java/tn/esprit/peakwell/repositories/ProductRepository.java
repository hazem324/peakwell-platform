package tn.esprit.peakwell.repositories;


import tn.esprit.peakwell.entities.Product;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {
}