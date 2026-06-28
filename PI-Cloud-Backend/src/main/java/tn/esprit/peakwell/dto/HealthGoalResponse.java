package tn.esprit.peakwell.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HealthGoalResponse {
  private Long id;
  private String metric;
  private String direction;
  private Double startValue;
  private Double targetValue;
  private String unit;
  private String deadline;
  private Boolean active;
  private Boolean achieved;
  private String achievedDate;
  private String createdAt;
  private Boolean paused;
  private String pauseReason;
  private Boolean assignedByDietitian;
  private String assignedByDietitianName;
  private List<MilestoneResponse> milestones;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class MilestoneResponse {
    private Long id;
    private String label;
    private Double targetValue;
    private Boolean reached;
    private String reachedDate;
    private String note;
  }
}