package tn.esprit.peakwell.dto;

import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DailyMenuDTO {

    private LocalDate date;

    private MealDTO breakfast;
    private MealDTO lunch;
    private MealDTO dinner;
    private Long id;
}