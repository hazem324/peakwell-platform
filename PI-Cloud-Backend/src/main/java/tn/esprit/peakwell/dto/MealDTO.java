package tn.esprit.peakwell.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MealDTO {

    private Long id;
    private String name;
    private String category;

    private double totalCalories;
    private double totalProtein;
    private double totalCarbs;
    private double totalFats;

    private String tags;
    private String image;

    private List<IngredientDTO> ingredients;

    private List<String> predictedAllergens;
    private int favoriteCount;
}