package tn.esprit.peakwell.dto;

import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;
import tn.esprit.peakwell.entities.Address;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserProfile {
    Long id;
    String email;
    String firstName;
    String lastName;
    String role;
    boolean profileCompleted;
    boolean enabled;
    String phoneNumber;
    String imageUrl;
    Address address;

    StudentProfile studentProfile;
    DietitianProfile dietitianProfile;
}