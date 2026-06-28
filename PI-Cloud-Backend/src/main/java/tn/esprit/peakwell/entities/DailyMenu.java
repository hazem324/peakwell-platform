package tn.esprit.peakwell.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DailyMenu {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate date;

    @ManyToOne
    private Meal breakfast;

    @ManyToOne
    private Meal lunch;

    @ManyToOne
    private Meal dinner;

    private Integer displayOrder;

}