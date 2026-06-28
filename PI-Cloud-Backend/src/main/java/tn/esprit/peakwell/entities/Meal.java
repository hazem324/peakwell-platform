package tn.esprit.peakwell.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Meal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Meal name is required")
    private String name;

    @NotBlank(message = "Category is required")
    private String category;

    private double totalCalories;
    private double totalProtein;
    private double totalCarbs;
    private double totalFats;

    private String tags;
    private String image;

    @OneToMany(
            mappedBy = "meal",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @Size(min = 1, message = "Meal must have at least one ingredient")
    private List<Ingredient> ingredients = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "meal_predicted_allergens",
            joinColumns = @JoinColumn(name = "meal_id")
    )
    @Column(name = "predicted_allergens")
    private List<String> predictedAllergens;

    private int favoriteCount = 0;

    private String userId;
}