package tn.esprit.peakwell.dto;

import lombok.Data;
import java.util.List;

@Data
public class HealthGoalRequest {
  private String metric;
  private String direction;
  private Double startValue;
  private Double targetValue;
  private String unit;
  private String deadline;
  private List<CustomMilestone> customMilestones;

  @Data
  public static class CustomMilestone {
    private String label;
    private Double targetValue;
  }
}