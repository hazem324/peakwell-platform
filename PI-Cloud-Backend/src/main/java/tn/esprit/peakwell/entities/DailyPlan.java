package tn.esprit.peakwell.entities;

import java.time.LocalDate;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    @ManyToOne
    private Meal breakfast;

    @ManyToOne
    private Meal lunch;

    @ManyToOne
    private Meal dinner;

    private double totalCalories;

    private double targetCalories;

    private String status;

    private LocalDate date;

    private String activityLevel;
    
    private double weight;
    
    private double height;
    
    private String allergiesHash;

    private String goal;
}