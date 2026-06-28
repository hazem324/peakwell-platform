package tn.esprit.peakwell.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class HealthAlertDto {
    private String type;
    private String metric;
    private String message;
    private String value;
}
