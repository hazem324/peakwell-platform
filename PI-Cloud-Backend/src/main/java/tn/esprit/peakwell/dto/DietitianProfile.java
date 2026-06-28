package tn.esprit.peakwell.dto;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class DietitianProfile {
    
    String specialization;
    Integer experienceYears;
    Double consultationPrice;
    String linkUrl;
    String certificateUrl;
}
