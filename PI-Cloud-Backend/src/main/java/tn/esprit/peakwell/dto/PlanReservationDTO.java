package tn.esprit.peakwell.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class PlanReservationDTO {
    private String userName;

    private String breakfastName;
    private String breakfastImage;

    private String lunchName;
    private String lunchImage;

    private String dinnerName;
    private String dinnerImage;
    
}
