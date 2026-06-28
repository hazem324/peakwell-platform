package tn.esprit.peakwell.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RiskUserDTO {
    private String email;
    private int totalFailedAttempts;
}