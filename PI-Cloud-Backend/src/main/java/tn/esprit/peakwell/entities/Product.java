package tn.esprit.peakwell.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Description is required")
    private String description;

    @Positive(message = "Calories must be positive")
    private double calories;

    @PositiveOrZero(message = "Protein must be >= 0")
    private double protein;

    @PositiveOrZero(message = "Carbs must be >= 0")
    private double carbs;

    @PositiveOrZero(message = "Fats must be >= 0")
    private double fats;

    @NotNull(message = "Category is required")
    @Enumerated(EnumType.STRING)
    private Category_Product category_Product;


    @PositiveOrZero(message = "Stock must be >= 0")
    private double stock;

    @Enumerated(EnumType.STRING)
    private UnitType unit;

    private String image;

    private double minStock;

    @Enumerated(EnumType.STRING)
    private StockStatus stockStatus;

    private String userId;
}