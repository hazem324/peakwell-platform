package tn.esprit.peakwell.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimelineEvent {

  private String id;
  private String date;              // ISO date string
  private String type;              // "biometric", "symptom", "goal", "alert", "milestone"
  private String title;
  private String subtitle;
  private String icon;
  private String color;             // severity/category color
  private String severity;          // "info", "success", "warning", "danger"
  private Map<String, Object> data; // type-specific payload
}
