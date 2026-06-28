package tn.esprit.peakwell.dto;

import lombok.Data;
import java.util.List;

@Data
public class SymptomEntryRequest {
  private String logDate;           // "2026-03-16"
  private String symptom;
  private Integer severity;          // 1-5
  private String timeOfDay;          // morning, afternoon, evening, night
  private Integer duration;          // minutes
  private String notes;
  private Integer mood;              // 1-5
  private Integer energyLevel;       // 1-5
  private Integer stressLevel;       // 1-5
  private List<String> tags;
  private List<String> triggers;
}
