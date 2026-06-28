package tn.esprit.peakwell.dto;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class StudentProfile {
    
    Double height;
    Double weight;
    String activityLevel;
    String goal;
}
