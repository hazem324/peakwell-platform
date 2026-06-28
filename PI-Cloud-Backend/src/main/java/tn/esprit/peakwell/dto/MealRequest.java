package tn.esprit.peakwell.dto;

import lombok.*;
import jakarta.validation.constraints.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MealRequest {

    @NotBlank
    private String name;

    @NotBlank
    private String category;

    @NotEmpty
    private List<IngredientRequest> ingredients;
    
}
