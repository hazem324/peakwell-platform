package tn.esprit.peakwell.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
 
@Data
@AllArgsConstructor
public class ActivityPerDayDTO {
    private String date;
    private long count;
}