package tn.esprit.peakwell.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class NutritionResponse {
    public double calories;
    public double protein;
    public double carbs;
    public double fats;
}
