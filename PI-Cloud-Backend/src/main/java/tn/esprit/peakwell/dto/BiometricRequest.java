package tn.esprit.peakwell.dto;


import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BiometricRequest {
    @NotNull private Double weight;
    @NotNull private Double height;
    private Double bodyFat;
    private Double muscleMass;
    private Integer systolic;
    private Integer diastolic;
    private Double glucose;
    private String notes;
}
