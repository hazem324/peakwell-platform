package tn.esprit.peakwell.dto;

import lombok.*;
import tn.esprit.peakwell.entities.Category_Product;
import tn.esprit.peakwell.entities.UnitType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductRequest {

    @NotBlank
    private String name;

    @NotBlank
    private String description;

    @PositiveOrZero
    private double calories;

    @PositiveOrZero
    private double protein;
    @PositiveOrZero
    private double carbs;
    @PositiveOrZero
    private double fats;

    @NotNull
    private Category_Product category_Product;

    @PositiveOrZero
    private double stock;

    private UnitType unit;

    private String image;

    private double minStock;
}