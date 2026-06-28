package tn.esprit.peakwell.dto;

import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;
import tn.esprit.peakwell.entities.Address;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateProfileRequest {

    String firstName;
    String lastName;

    //  Student
    Float height;
    Float weight;
    String activityLevel;
    String goal;

    //  Dietitian
    String specialization;
    String certification;
    String linkUrl;
    Integer experienceYears;
    Double consultationPrice;

    //  Shared 
    String imgUrl;

    //  NEW
    String phoneNumber;
    Address address;
}