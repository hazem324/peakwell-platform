package tn.esprit.peakwell.dto;

import lombok.Data;
import java.util.List;

@Data
public class MedicalProfileResponse {
    private Long id;
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
    private boolean complete;
    private Long studentId;
    private String studentName;
    private Long dietitianId;
    private String dietitianName;
    private String dietitianSpecialization;
}