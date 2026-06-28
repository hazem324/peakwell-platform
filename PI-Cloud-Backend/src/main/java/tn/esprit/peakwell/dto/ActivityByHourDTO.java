package tn.esprit.peakwell.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
 
@Data
@AllArgsConstructor
public class ActivityByHourDTO {
    private int hour;    // 0–23
    private long count;
}
