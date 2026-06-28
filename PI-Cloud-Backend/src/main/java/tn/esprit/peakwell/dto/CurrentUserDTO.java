package tn.esprit.peakwell.dto;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import tn.esprit.peakwell.entities.Address;

@Data
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CurrentUserDTO {

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
}

