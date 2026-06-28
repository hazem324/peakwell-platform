package tn.esprit.peakwell.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "meal_predicted_allergens")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MealPredictedAllergen {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "meal_id")
    private Long mealId;

    @Column(name = "predicted_allergens")
    private String predictedAllergens; 
    
}
