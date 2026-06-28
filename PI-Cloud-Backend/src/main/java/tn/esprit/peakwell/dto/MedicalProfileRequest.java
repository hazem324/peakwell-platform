package tn.esprit.peakwell.dto;

import lombok.Data;
import java.util.List;

@Data
public class MedicalProfileRequest {
    private String firstName;
    private String lastName;
    private String dateOfBirth;
    private String gender;
    private String bloodType;
    private Double height;
    private String emergencyContact;
    private List<String> allergies;
    private List<String> conditions;
    private List<String> medications;
    private Long studentId;
    private Long dietitianId;
}