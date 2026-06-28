package tn.esprit.peakwell.dto;

import lombok.Data;
import java.util.List;

@Data
public class SymptomEntryResponse {
  private Long id;
  private String logDate;
  private String symptom;
  private Integer severity;
  private String timeOfDay;
  private Integer duration;
  private String notes;
  private Integer mood;
  private Integer energyLevel;
  private Integer stressLevel;
  private List<String> tags;
  private List<String> triggers;
  private String createdAt;
}
