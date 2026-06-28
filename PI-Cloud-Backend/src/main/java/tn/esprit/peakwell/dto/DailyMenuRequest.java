package tn.esprit.peakwell.dto;

import java.time.LocalDate;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DailyMenuRequest {

    private Long breakfastId;
    private Long lunchId;
    private Long dinnerId;

    private LocalDate date;
    private Long id;

}
