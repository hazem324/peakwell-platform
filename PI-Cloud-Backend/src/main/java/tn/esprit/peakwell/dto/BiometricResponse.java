package tn.esprit.peakwell.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class BiometricResponse {
    private Long id;
    private Double weight;
    private Double height;
    private Double bmi;
    private Double bodyFat;
    private Double muscleMass;
    private Integer systolic;
    private Integer diastolic;
    private Double glucose;
    private String notes;
    private LocalDateTime recordedAt;
}
