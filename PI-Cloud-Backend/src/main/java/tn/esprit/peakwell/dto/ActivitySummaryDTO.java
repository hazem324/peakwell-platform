package tn.esprit.peakwell.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ActivitySummaryDTO {
    private long total;
    private long success;
    private long failed;
    private double successRate; // percentage
}