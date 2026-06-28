package tn.esprit.peakwell.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class FailedAttemptsStatsDTO {
    private long zeroToOne;
    private long twoToFour;
    private long moreThanFour;
}