package tn.esprit.peakwell.dto;

import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;
import tn.esprit.peakwell.entities.Address;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProfileRequest {

    String role;

    Float height;
    Float weight;
    String activityLevel;
    String goal;

    String specialization;
    String certification; // certificate URL
    String linkUrl;
    Integer experienceYears;
    Double consultationPrice;

    
    String imgUrl;

    String phoneNumber;
    Address address;
}