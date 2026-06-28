package tn.esprit.peakwell.dto;

import lombok.Data;

@Data
public class DietitianProfileRequest {
  String specialization;
  String certification;
  String linkUrl;
  Integer experienceYears;
  Double consultationPrice;
}
